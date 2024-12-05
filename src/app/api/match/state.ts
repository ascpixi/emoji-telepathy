import { Player } from "@prisma/client";

import { EMOJI_TIMER_MS, HEARTBEAT_DEADLINE_MS } from "@/app/game";
import { prisma } from "../db";
import { getNewer, last } from "@/app/util";
import { advanceSimulation, MATCHMAKE_WITH_BOT_DEADLINE } from "../bot";

/**
 * Represents a state of a match, where the match has not yet begun, and is
 * awaiting another player to join.
 */
export interface MatchmakingMatchState {
    state: "MATCHMAKING";
}

/**
 * Represents an on-going match.
 */
export interface OngoingMatchState {
    state: "ONGOING";

    /**
     * The history of emoji picks.
     */
    history: { you: string, partner: string }[];

    /**
     * If `true`, the partner already picked an emoji.
     */
    partnerPicked: boolean;
}

/**
 * Represents a match that has ended. After receiving a `MatchState` with a
 * `state` equal to `"ENDED"`, all further poll calls to the `/api/match` endpoint
 * will be rejected.
 */
export interface EndedMatchState {
    state: "ENDED";

    /**
     * The history of emoji picks. If the last entry has an equal `you` and `partner`,
     * the players have won the match. Otherwise, one of the players wasn't able to
     * pick an emoji in time. 
     */
    history: { you: string, partner: string }[];
}

/**
 * Represents a `MatchState` which describes a match that does not exist (or
 * has been terminated).
 */
export interface InvalidMatchState {
    state: "INVALID";
}

/**
 * Represents the state of a match. The `state` field determines the schema
 * of the object.
 */
export type MatchState =
    MatchmakingMatchState |
    OngoingMatchState |
    EndedMatchState |
    InvalidMatchState;

/**
 * Gets the full match history, for both the given player and their partner.
 * Also returns an aggregated (`all`) version of the history, which reflects
 * the visible state of the game.
 * 
 * The history is always sorted in ascending order - that is, the earliest moves
 * are at the beginning of the array, and the latest moves are at the end.
 */
export async function getHistory(player: Player) {
    const playerEmojis = await prisma.emojiPick.findMany({
        where: { byId: player.id },
        orderBy: { createdAt: "asc" }
    });

    const partnerEmojis = await prisma.emojiPick.findMany({
        where: { byId: player.partnerId! },
        orderBy: { createdAt: "asc" }
    });

    const historyLength = Math.min(playerEmojis.length, partnerEmojis.length);

    const allEmojis = playerEmojis.slice(0, historyLength)
        .map((x, i) => ({ you: x.emoji, partner: partnerEmojis[i].emoji }));

    return {
        player: playerEmojis,
        partner: partnerEmojis,
        all: allEmojis
    };
}

/**
 * Generates a `MatchState` object, given a player ID.
 */
export async function generateState(id: string): Promise<MatchState> {
    const player = await prisma.player.findFirst({
        where: { id: id }
    });

    if (player == null)
        return { state: "INVALID" };

    if (player.partnerId == null) {
        const secsSinceStart = (new Date().getTime() - player.createdAt.getTime()) / 1000;
        if (secsSinceStart >= MATCHMAKE_WITH_BOT_DEADLINE) {
            // This player has waited long enough to be matched with a bot.
            // Create one, and assign it as their partner.
            const created = await prisma.player.create({
                data: {
                    partnerId: player.id,
                    isSimulated: true
                }
            });

            await prisma.player.update({
                where: { id: player.id },
                data: { partnerId: created.id }
            });

            player.partnerId = created.id;
            console.log(`(info) created and assigned a bot ${created.id} to ${player.id} (was waiting for ${secsSinceStart}s)`);
        } else {
            return { state: "MATCHMAKING" };
        }
    }

    const partnerState = await prisma.player.findFirst({
        where: { id: player.partnerId },
        select: { lastHeartbeat: true, createdAt: true, isSimulated: true }
    });

    const heartbeatDeadline = new Date(Date.now() - HEARTBEAT_DEADLINE_MS);
    if (
        player.lastHeartbeat < heartbeatDeadline ||
        partnerState == null ||
        partnerState.lastHeartbeat < heartbeatDeadline
    ) {
        // At least one of the players missed the heartbeat deadline. Assume
        // they left the match.
        return { state: "INVALID" };
    }

    if (partnerState.isSimulated) {
        await advanceSimulation(player.partnerId);
    }

    const history = await getHistory(player);
    const emojiDeadline = new Date(new Date().getTime() - EMOJI_TIMER_MS);

    if (history.all.length != 0) {
        if (
            // If the last emojis are equal, that means the players won
            (last(history.all).partner == last(history.all).you) ||

            // ...however, if any of the players didn't pick an emoji in time, the game also ends, this time with the players losing
            (last(history.player).createdAt < emojiDeadline || last(history.partner).createdAt < emojiDeadline)
        ) {
            return {
                state: "ENDED",
                history: history.all
            };
        }
    } else {
        // If none of the players picked *any* emoji, we also need to check if the timer has ended.
        // The creation time of the later player session is then the match begin time.
        //
        // We add 1000ms to compensate for latency. This means that for a short period of time,
        // players can still pick an emoji, even if the timer hit 0. This is intentional.
        const begunAt = getNewer(player.createdAt, partnerState.createdAt);
        if (begunAt.getTime() + 900 < emojiDeadline.getTime()) {
            return {
                state: "ENDED",
                history: history.all
            };
        }
    }

    return {
        state: "ONGOING",
        partnerPicked: history.partner.length > history.player.length,
        history: history.all
    };
}