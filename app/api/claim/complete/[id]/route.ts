import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function POST(
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

    // Pobierz reklamację
    const { rows } = await sql`SELECT * FROM claims WHERE id = ${id}`;
    if (rows.length === 0)
        return NextResponse.json(
            { error: "Nie znaleziono reklamacji" },
            { status: 404 }
        );

    const claim = rows[0];
    const completedAt = new Date();

    // Przenieś do historii
    await sql`
    INSERT INTO claims_history (name, email, description, created_at, completed_at, due_date)
    VALUES (${claim.name}, ${claim.email}, ${claim.description}, ${
        claim.created_at
    }, ${completedAt.toISOString()}, ${claim.due_date})
  `;

    // Usuń z aktualnych
    await sql`DELETE FROM claims WHERE id = ${id}`;

    return NextResponse.json({ ok: true });
}
