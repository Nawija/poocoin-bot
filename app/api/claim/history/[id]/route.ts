import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    await initDb();
    const id = params.id;

    const result =
        await sql`DELETE FROM claims_history WHERE id = ${id} RETURNING *`;

    if (result.rowCount === 0) {
        return NextResponse.json(
            { error: "Nie znaleziono rekordu w historii" },
            { status: 404 }
        );
    }

    return NextResponse.json({ ok: true });
}
