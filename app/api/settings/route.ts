import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
    await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      smtp_host TEXT,
      smtp_port INT,
      smtp_secure BOOLEAN,
      smtp_email TEXT,
      smtp_pass TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

    const result =
        await sql`SELECT smtp_host, smtp_port, smtp_secure, smtp_email, smtp_pass FROM settings ORDER BY id DESC LIMIT 1;`;
    return NextResponse.json(result.rows[0] || {});
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { smtp_host, smtp_port, smtp_secure, smtp_email, smtp_pass } =
            body;

        if (
            !smtp_host ||
            !smtp_port ||
            smtp_secure === undefined ||
            !smtp_email ||
            !smtp_pass
        ) {
            return NextResponse.json(
                { error: "Brakuje danych" },
                { status: 400 }
            );
        }

        await sql`INSERT INTO settings (smtp_host, smtp_port, smtp_secure, smtp_email, smtp_pass) VALUES (${smtp_host}, ${smtp_port}, ${smtp_secure}, ${smtp_email}, ${smtp_pass});`;

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json(
            { error: err?.message || "Błąd serwera" },
            { status: 500 }
        );
    }
}
