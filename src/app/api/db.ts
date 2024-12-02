import { PrismaClient } from "@prisma/client";
import { HEARTBEAT_DEADLINE_MS } from "../game";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

/**
 * Removes all data from the database that has expired.
 */
export async function dbCleanup() {
    const expirationThreshold = new Date(Date.now() - HEARTBEAT_DEADLINE_MS)

    // Fetch players with lastHeartbeat older than the threshold, including their partners
    const players = await prisma.player.findMany({
        where: { lastHeartbeat: { lt: expirationThreshold } },
        include: {
            partner: true,
        },
    })

    const playerIdsToDelete: string[] = []

    players.forEach(player => {
        playerIdsToDelete.push(player.id);

        // This will cause further requests from the partner (assuming they are
        // alive) to `/api/match` to return a match state of `INVALID`. This is
        // fine, we handle that on the client-side as "match abandoned"
        if (player.partnerId) {
            playerIdsToDelete.push(player.partnerId);
        }
    });

    const uniqueDeadPlayerIds = Array.from(new Set(playerIdsToDelete));

    if (uniqueDeadPlayerIds.length > 0) {
        await prisma.emojiPick.deleteMany({
            where: { byId: { in: uniqueDeadPlayerIds } },
        });

        await prisma.player.deleteMany({
            where: { id: { in: uniqueDeadPlayerIds } },
        });

        console.log(`( bg ) cleanup: removed ${uniqueDeadPlayerIds.length} dead records`);
    }
}

/**
 * Runs the given asynchronous block while cleaning up the database.
 */
export async function runWhileCleaningUp<T>(fn: () => Promise<T>) {
    return (await Promise.all([
        fn(),
        dbCleanup(),
    ]))[0];
}