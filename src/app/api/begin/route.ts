import { NextRequest, NextResponse } from "next/server";
import { generateState as generateMatchState, MatchState } from "../match/state";
import { turnstileVerify } from "../turnstile";
import { apiError } from "../util";
import { prisma, runWhileCleaningUp } from "../db";

/**
 * Represents the deserialized JSON schema of the `/api/begin` API endpoint.
 */
export type ApiBeginResponseSchema = {
    id: string,
    match: MatchState
} | {
    error: string
};

/**
 * ### `/api/begin`
 * Begins a player session.
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiBeginResponseSchema>> {
    if (!await turnstileVerify(req))
        return apiError("Turnstile verification failed");

    return await runWhileCleaningUp(async () => {
        const searchingPlayer = await prisma.player.findFirst({
            where: { partnerId: null },
            orderBy: { createdAt: "asc" }
        });

        if (searchingPlayer != null) {
            // We already have a player that's searching for a game.
            const created = await prisma.player.create({
                data: { partnerId: searchingPlayer.id }
            });

            await prisma.player.update({
                where: { id: searchingPlayer.id },
                data: { partnerId: created.id }
            });

            console.log(`(info) created ready player session ${created.id} (partnered with ${searchingPlayer.id})`);
            return NextResponse.json({
                id: created.id,
                match: await generateMatchState(created.id)
            });
        }

        const created = await prisma.player.create({ data: {} });
        console.log(`(info) created awaiting player session ${created.id}`);

        return NextResponse.json({
            id: created.id,
            match: {
                state: "MATCHMAKING"
            }
        });
    });
}