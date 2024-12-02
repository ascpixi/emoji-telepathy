import { NextRequest, NextResponse } from 'next/server';

import { turnstileVerify } from '../turnstile';
import { generateState, MatchState } from './state';
import { apiError } from '../util';
import { prisma } from '../db';

export type ApiMatchResponseSchema = MatchState | {
    error: string
};

/**
 * ### `/api/match`
 * Queries the state of a match, given a player session ID.
 * This endpoint is designed to be polled - if a client does not access this endpoint
 * in more than `HEARTBEAT_DEADLINE_MS` milliseconds, their session will be considered
 * abandoned.
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiMatchResponseSchema>> {
    if (!req.nextUrl.searchParams.has("playerId"))
        return apiError("Missing 'playerId' parameter");

    const playerId = req.nextUrl.searchParams.get("playerId")!;
    const playerExists = await prisma.player.count({
        where: { id: playerId }
    }) != 0;

    if (!playerExists)
        return NextResponse.json({ state: "INVALID" });

    await prisma.player.update({
        where: { id: playerId },
        data: { lastHeartbeat: new Date() }
    });

    const state = await generateState(playerId);
    return NextResponse.json(state);
}