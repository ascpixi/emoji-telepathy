"use server";

import { NextRequest } from "next/server";

/**
 * Verifies that a Turnstile-protected request to the API is valid. If running
 * in development mode, this function always returns `true` and performs no API
 * calls to Cloudflare.
 */
export async function turnstileVerify(req: NextRequest) {
    if (process.env.NODE_ENV == "development")
        return true;

    const ip = req.headers.get("x-real-ip");
    if (ip == null)
        return false;

    const token = req.nextUrl.searchParams.get("tt");
    if (!token)
        return false;

    const body = new FormData();
    body.append("secret", process.env.NEXT_PRIVATE_TURNSTILE_SECRET_KEY!);
    body.append("response", token);
    body.append("remoteip", ip);

    try {
        const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            body: body,
            method: "POST"
        });

        const outcome = await result.json();
        if (!outcome.success) {
            return false;
        }
    } catch (err) {
        console.warn("(warn) an error occured while verifying with Turnstile:", err);
        return false;
    }

    return true;
}