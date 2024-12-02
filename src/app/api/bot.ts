import { last, pickRandom } from '../util';
import { prisma } from './db';
import { getHistory } from './match/state';

import twemoji from '@emoji-mart/data/sets/15/twitter.json'

type EmojiMeta = typeof twemoji.emojis[keyof typeof twemoji.emojis];

/**
 * Determines how much time a player must wait to be matched with a bot.
 */
export const MATCHMAKE_WITH_BOT_DEADLINE = 6.5;

/** 
 * The chance for a bot to pick an emoji on a tick, where the player it is playing
 * against is also choosing an emoji.
 */
const BOT_CHOOSE_CHANCE = 0.2;

/**
 * The chance for a bot to ignore their own choices and try to make a choice
 * purely off the pick history of the player.
 */
const BOT_IGNORE_SELF_CHANCE = 1 / 3;

/**
 * The minimum amount of milliseconds the bot has to wait, relative to its creation
 * time, before attempting to perform a move.
 */
const BOT_INITIAL_WAIT_MS = 1200;

/**
 * If the match history is larger than this number, the bot will be given the
 * ability to "cheat" - that is, if the bot hasn't yet picked an emoji, but the
 * player has, the bot may peek what the player has chosen, and choose that,
 * artificially ending the game.
 */
const BOT_CHEAT_THRESHOLD = 10;

/**
 * The chance for a bot to cheat. Only applies after `BOT_CHEAT_THRESHOLD`.
 */
const BOT_CHEAT_CHANCE = 0.2;

/**
 * The emojis a bot may start with when a game with the bot begins.
 */
const BOT_GAME_STARTERS = [
    "😍", "😀", "😗", "🤑", "⛱️", "😺", "🐈", "🌸", "🛠️", "📷", "🌠", "✈️", "🏚️", "🦸‍♂️", "💉", "☠️"
];

/**
 * Maps keywords to native emoji representations.
 */
const keywordBuckets = (() => {
    const map = new Map<string, string[]>();

    let key: keyof typeof twemoji.emojis;
    for (key in twemoji.emojis) {
        const emoji = twemoji.emojis[key];

        for (const keyword of emoji.keywords) {
            if (emoji.skins.length < 1)
                continue;

            if (map.has(keyword)) {
                map.get(keyword)!.push(emoji.skins[0].native);
            } else {
                map.set(keyword, [emoji.skins[0].native]);
            }
        }
    }

    return map;
})();

/**
 * Maps native emoji representations to their metadata.
 */
const nativeToMeta = (() => {
    const map = new Map<string, EmojiMeta>();

    let key: keyof typeof twemoji.emojis;
    for (key in twemoji.emojis) {
        const emoji = twemoji.emojis[key];
        map.set(emoji.skins[0].native, emoji);
    }

    return map;
})();

const emojiArray = Object.values(twemoji.emojis);

/**
 * Returns the most similar emoji to the given array of `emojis`. May return
 * `null` if no similar emojis could be found.
 */
function findMultipleSimilar(emojis: string[], exclude: Set<string>) {
    const candidates = new Map<string, number>();

    for (const emoji of emojis) {
        const meta = nativeToMeta.get(emoji.trim())!;

        for (const keyword of meta.keywords) {
            for (const candidate of keywordBuckets.get(keyword)!) {
                if (exclude.has(candidate))
                    continue;

                candidates.set(candidate, (candidates.get(candidate) ?? 0) + 1);
            }
        }
    }

    const sorted = Array.from(candidates.entries())
        .sort((a, b) => b[1] - a[1]);

    return sorted.length > 0 ? sorted[0][0] : null;
}

export async function advanceSimulation(id: string) {
    const bot = await prisma.player.findFirst({
        where: { id: id }
    });

    if (!bot)
        throw new Error(`No player with ID ${id} found.`);

    if (!bot.isSimulated)
        throw new Error(`Attempted to advance simulation on a non-simulated player ${id}.`);

    await prisma.player.update({
        where: { id: id },
        data: { lastHeartbeat: new Date() }
    });

    const history = await getHistory(bot);

    const botHistory = history.player;
    const playerHistory = history.partner;

    if (botHistory.length > playerHistory.length) {
        // We're waiting for the player right now, so don't do anything.
        return;
    }

    if ((new Date().getTime() - bot.createdAt.getTime()) < BOT_INITIAL_WAIT_MS) {
        return;
    }

    // Simulate thinking - if the player isn't waiting for us right now,
    // the chance for us to pick an emoji is random.
    if (botHistory.length == playerHistory.length) {
        if (!(Math.random() < BOT_CHOOSE_CHANCE)) {
            return; // we are "thinking"
        }
    }

    if (history.all.length == 0) {
        // No previous history - pick a random, common emoji.
        const emoji = pickRandom(BOT_GAME_STARTERS);
        await prisma.emojiPick.create({
            data: { byId: bot.id, emoji: emoji }
        });

        console.log(`(info) 🤖 #${bot.id}: picked ${emoji}`);
        return;
    }

    if (
        // If the bot has the ability to cheat at this point...
        history.all.length >= BOT_CHEAT_THRESHOLD &&

        // ...and the player has already chosen their emoji...
        playerHistory.length > botHistory.length &&

        // ...and chance tells us to cheat...
        Math.random() < BOT_CHEAT_CHANCE
    ) {
        // ...then cheat! >:3
        await prisma.emojiPick.create({
            data: {
                byId: bot.id,
                emoji: last(playerHistory).emoji
            }
        });

        console.log(`(info) 🤖 #${bot.id}: cheated`);
        return;
    }

    const exclude = new Set(history.all.flatMap(x => [x.you, x.partner]));

    // Pick an emoji via simple keyword-based heuristics. We take the last 2
    // emojis, and try to find the most similar one.
    let n = Math.min(history.all.length, 2);
    let similar: string | null = null;

    while (similar === null && n <= history.all.length) {
        let emojis: string[];

        if (history.all.length > 3 && Math.random() < BOT_IGNORE_SELF_CHANCE) {
            emojis = playerHistory.slice(-n).map(x => x.emoji);
        } else {
            emojis = history.all.slice(-n).flatMap(x => [x.you, x.partner])
        }

        similar = findMultipleSimilar(emojis, exclude);
        n++;
    }

    if (similar === null) {
        // We still couldn't find any similar emoji (?!?!?!), try picking a random one...
        let randomEmoji: string | null = null;
        
        while (randomEmoji === null || exclude.has(randomEmoji)) {
            randomEmoji = pickRandom(emojiArray).skins[0].native;
        }

        await prisma.emojiPick.create({
            data: { byId: bot.id, emoji: randomEmoji }
        });

        console.log(`(info) 🤖 #${bot.id}: couldn't find similar emojis for n=${n}! picked ${randomEmoji}`);
        return;
    }

    await prisma.emojiPick.create({
        data: { byId: bot.id, emoji: similar }
    });

    console.log(`(info) 🤖 #${bot.id}: picked most similar emoji ${similar}`);
}