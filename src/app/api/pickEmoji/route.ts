import { NextRequest, NextResponse } from 'next/server';

import { turnstileVerify } from '../turnstile';
import { apiError } from '../util';
import { prisma, runWhileCleaningUp } from '../db';
import emojiRegex from 'emoji-regex';

export type ApiPickEmojiResponseSchema = {
    success: true
} | {
    error: string
};

/**
 * ### `/api/pickEmoji`
 * Picks an emoji. This endpoint can only be called once per round.
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiPickEmojiResponseSchema>> {
    if (!req.nextUrl.searchParams.has("playerId"))
        return apiError("Missing 'playerId' parameter");

    if (!req.nextUrl.searchParams.has("emoji"))
        return apiError("Missing 'emoji' parameter");

    // The following will ignore any extraneous characters before/after the actual
    // emoji, and will only fail if there's e.g. more than one emoji.
    const emojiMatch = req.nextUrl.searchParams.get("emoji")!.match(emojiRegex());
    if (emojiMatch == null || emojiMatch.length != 1)
        return apiError("Malformed emoji");

    const emoji = emojiMatch[0];

    return await runWhileCleaningUp(async () => {
        const player = await prisma.player.findFirst({
            where: { id: req.nextUrl.searchParams.get("playerId")! },
            select: {
                id: true,
                partnerId: true
            }
        });
    
        if (player == null)
            return apiError("Unknown player ID");
    
        if (player.partnerId == null)
            return apiError("Cannot pick an emoji while searching for a partner");
    
        const playerPickCount = await prisma.emojiPick.count({
            where: { byId: player.id }
        });
    
        const partnerPickCount = await prisma.emojiPick.count({
            where: { byId: player.partnerId }
        });
    
        // The number of the player's emoji picks must be equal (both the partner and
        // the player didn't pick) or less than (the partner already picked) the number
        // of the partner's emoji picks.
        if (playerPickCount > partnerPickCount)
            return apiError("You already picked an emoji in this round");

        let partnerPickedThat: boolean;

        if (playerPickCount < partnerPickCount) {
            // If the partner already picked their emoji in this round, we ignore
            // their last emoji (the one they picked in this round).
            const partnerPicks = await prisma.emojiPick.findMany({
                where: { byId: player.partnerId },
                select: { emoji: true },
                orderBy: { createdAt: "asc" }
            });

            partnerPickedThat = partnerPicks.slice(0, -1).some(x => x.emoji == emoji);
        } else {
            partnerPickedThat = await prisma.emojiPick.count({
                where: { byId: player.partnerId, emoji: emoji }
            }) != 0;
        }

        if (partnerPickedThat)
            return apiError("That emoji was already picked before by your partner");

        const playerPickedThat = await prisma.emojiPick.count({
            where: { byId: player.id, emoji: emoji }
        }) != 0;

        if (playerPickedThat)
            return apiError("That emoji was already picked before by yourself");
    
        await prisma.emojiPick.create({
            data: {
                emoji: emoji,
                byId: player.id
            }
        });

        console.log(`(info) player ${player.id} made a move: ${emoji}`);
        return NextResponse.json({ success: true });
    });
}