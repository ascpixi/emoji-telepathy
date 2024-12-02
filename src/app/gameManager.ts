import { MatchState } from "./api/match/state";
import { ApiBeginResponseSchema } from "./api/begin/route";
import { ApiMatchResponseSchema } from "./api/match/route";
import { ApiPickEmojiResponseSchema } from "./api/pickEmoji/route";

/**
 * Handles a single player session, identified by a player ID.
 */
export class GameConnection {
    playerId: string;

    /**
     * Invoked whenever the client receives updated data about the current match.
     */
    onMatchStateChange: ((state: MatchState) => void) | null;

    constructor(playerId: string) {
        this.playerId = playerId;
        this.onMatchStateChange = null;

        const id = setInterval(async () => {
            const resp = await fetch(`/api/match?playerId=${playerId}`);
            const data = await resp.json() as ApiMatchResponseSchema;
            if ("error" in data) {
                console.error("/api/match failed:", data);
                return;
            }

            console.log("[game] match state updated.", data);

            this.onMatchStateChange?.(data);
            if (data.state == "ENDED" || data.state == "INVALID") {
                clearInterval(id);
            }
        }, 500);
    }

    async submitPick(emoji: string): Promise<void> {
        const resp = await fetch(`/api/pickEmoji?playerId=${this.playerId}&emoji=${encodeURIComponent(emoji)}`);
        const data = await resp.json() as ApiPickEmojiResponseSchema;
        if ("error" in data) {
            throw new Error(data.error);
        }
    }
}

/**
 * Creates a new `GameConnection` by retrieving a new player session.
 */
export async function createGameConnection(
    turnstileToken: string,
    onMatchStateChange: (state: MatchState) => void
): Promise<GameConnection | null> {
    console.log("[game] creating new player session");

    const resp = await fetch(`/api/begin?tt=${turnstileToken}`);
    const data = await resp.json() as ApiBeginResponseSchema;
    if ("error" in data) {
        alert(`We couldn't create a game for you! ${data.error}`);
        return null;
    }

    console.log("[game] player session created", data);

    const playerId = data.id;
    onMatchStateChange(data.match);

    console.log("[game] connected");

    const game = new GameConnection(playerId);
    game.onMatchStateChange = onMatchStateChange;
    return game;
}