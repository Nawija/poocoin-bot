import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    await initDb();

    const id = Number(params.id);
    if (isNaN(id)) {
        return NextResponse.json(
            { error: "Niepoprawne ID reklamacji." },
            { status: 400 }
        );
    }

    try {
        await sql`DELETE FROM claims WHERE id = ${id};`;
        return NextResponse.json({ ok: true, message: "Reklamacja usunięta." });
    } catch (err) {
        console.error("Błąd przy usuwaniu:", err);
        return NextResponse.json(
            { error: "Błąd przy usuwaniu reklamacji." },
            { status: 500 }
        );
    }
}
