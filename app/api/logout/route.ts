import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ ok: true });
    // usuwamy cookie
    response.cookies.set("user", "", { path: "/", maxAge: 0 });
    return response;
}
