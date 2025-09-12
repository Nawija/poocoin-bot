import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function GET() {
    await initDb();
    const result = await sql`
    SELECT 
      id, 
      name, 
      email, 
      description, 
      createdat::timestamptz AT TIME ZONE 'UTC' AS created_at,
      due_date
    FROM claims
    ORDER BY due_date ASC NULLS LAST
  `;
    return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
    await initDb();
    const { name, email, description, due_date } = await req.json();

    if (!name || !email || !description) {
        return NextResponse.json(
            { error: "Wszystkie pola są wymagane." },
            { status: 400 }
        );
    }

    // ustawiamy createdat (teraz) i due_date (za 14 dni)
    const createdAt = new Date();
    const dueDate = new Date(due_date); // 👈 bierzemy z inputa
    dueDate.setDate(dueDate.getDate() + 14);

    await sql`
    INSERT INTO claims (name, email, description, createdat, due_date)
    VALUES (${name}, ${email}, ${description}, ${createdAt.toISOString()}, ${dueDate.toISOString()});
  `;

    return NextResponse.json({ ok: true });
}
