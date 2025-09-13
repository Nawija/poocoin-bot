import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(req: Request) {
    const { username, password } = await req.json();

    if (!username || !password) {
        return NextResponse.json(
            { error: "Username and password required" },
            { status: 400 }
        );
    }

    const result = await sql`SELECT * FROM users WHERE username = ${username}`;
    const user = result.rows[0];
    if (!user || user.password_hash !== password) {
        return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
        );
    }

    // ustawiamy cookie z tokenem sesji (prosto username)
    const response = NextResponse.json({ ok: true });
    response.cookies.set("user", username, { httpOnly: true, path: "/" });
    return response;
}
