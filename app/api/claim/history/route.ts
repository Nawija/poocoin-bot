import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function GET() {
    await initDb();
    const result = await sql`
    SELECT id, name, email, description, created_at, completed_at, due_date
    FROM claims_history
    ORDER BY completed_at DESC
  `;
    return NextResponse.json(result.rows);
}
