import { NextResponse } from "next/server";

/**
 * Returns a `NextResponse` that represents a user error, with the given message.
 */
export function apiError(message: string) {
    return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Represents the result of a function invocation.
 */
export type Result<T> =
    { ok: false, error: string } |
    { ok: true, value: T };

/**
 * Returns a `Result<T>` that represents a successful function invocation,
 * yielding the given value.
 */
export function ok<T>(value: T): Result<T> {
    return { ok: true, value };
}

/**
 * Returns a `Result<T>` that represents a failed function invocation, with the
 * given error message.
 */
export function err<T>(error: string): Result<T> {
    return { ok: false, error }
}

type ParamTypeof = "string" | "number" | "boolean" | "object";

type TypeMapping = {
    "string": string;
    "number": number;
    "boolean": boolean;
    "object": object;
}

type ParamsFromSchema<T extends { [key: string]: keyof TypeMapping }> = {
    [K in keyof T]: TypeMapping[T[K]]
}

/**
 * Reads GET parameters with the specified names and types, returning an
 * `Result<T>` that represents an error if a parameter is missing
 * (or of an invalid type).
 * 
 * Example usage:
 * ```
 * const params = requireParams(req.nextUrl.searchParams, {
 *      waow: "string",
 *      meow: "number"
 * });
 * ```
 */
export function requireParams<T extends { [key: string]: ParamTypeof }>(
    rawParams: URLSearchParams,
    schema: T
): Result<ParamsFromSchema<T>> {
    const map: { [param: string]: string } = {};

    for (const [name, type] of Object.entries(schema)) {
        const val = rawParams.get(name);
        if (val === null) {
            return err(`The required parameter '${name}' was not provided.`);
        }

        if (typeof val !== type) {
            return err(`The parameter ${name} was of an invalid type (expected a ${type}, not a ${typeof val}).`);
        }

        map[name] = val;
    }

    return ok(map as ParamsFromSchema<T>);
}