import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await initDb();
    const { id } = params;

    await sql`DELETE FROM claims WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Delete error:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
