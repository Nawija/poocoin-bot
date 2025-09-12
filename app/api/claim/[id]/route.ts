import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function DELETE(
    _req: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
    await initDb();

    const awaitedParams = await Promise.resolve(params);
    const { id } = awaitedParams;

    try {
        await sql`DELETE FROM claims WHERE id = ${id}`;
        return NextResponse.json({ ok: true, message: "Reklamacja usunięta" });
    } catch (err) {
        console.error("Błąd przy usuwaniu:", err);
        return NextResponse.json(
            { error: "Nie udało się usunąć reklamacji" },
            { status: 500 }
        );
    }
}
