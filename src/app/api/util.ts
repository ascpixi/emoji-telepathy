import { NextResponse } from "next/server";

export function apiError(message: string) {
    return NextResponse.json({ error: message }, { status: 400 });
}