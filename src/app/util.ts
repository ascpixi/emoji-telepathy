/**
 * Returns a `Promise` that resolves after the specified amount of milliseconds.
 */
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Equivalent to `arr[arr.length - 1]`.
 */
export function last<T>(arr: T[]) {
    return arr[arr.length - 1];
}

/**
 * Equivalent to `fn(last(arr))`.
 */
export function withLast<TIn, TOut>(arr: TIn[], fn: (x: TIn) => TOut): TOut {
    return fn(last(arr));
}

/**
 * Gets the date that is newer - that is, further in time.
 */
export function getNewer(d1: Date, d2: Date) {
    return d1 < d2 ? d2 : d1;
}

/**
 * Always throws an error, returning an indeterminate value. This may be
 * used to terminate from a function early.
 */
export function raise<T>(error: Error): T {
    throw error;
}

/**
 * Picks a random integer, from `min` (inclusive) to `max` (exclusive). 
 * @param min The minimum bound, inclusive.
 * @param max The maximum bound, exclusive.
 */
export function rng(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Picks a random element from the given array.
 */
export function pickRandom<T>(arr: T[]): T {
    if (arr.length == 0)
        throw new Error("Attempted to pick a random element from an empty array.");

    return arr[rng(0, arr.length)];
}