import { NextRequest, NextResponse } from "next/server";

import { generateState, MatchState } from "./state";
import { apiError, requireParams } from "../util";
import { prisma } from "../db";

/**
 * Represents the deserialized JSON schema of the `/api/match` API endpoint.
 */
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
    const params = requireParams(req.nextUrl.searchParams, {
        playerId: "string"
    });

    if (!params.ok)
        return apiError(params.error);

    const playerExists = await prisma.player.count({
        where: { id: params.value.playerId }
    }) != 0;

    if (!playerExists)
        return NextResponse.json({ state: "INVALID" });

    await prisma.player.update({
        where: { id: params.value.playerId },
        data: { lastHeartbeat: new Date() }
    });

    const state = await generateState(params.value.playerId);
    return NextResponse.json(state);
}