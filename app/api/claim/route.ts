import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function GET() {
    await initDb();
    const result = await sql`
    SELECT 
      id, name, email, description, createdat::timestamptz AT TIME ZONE 'UTC' AS created_at,
      due_date
    FROM claims
    ORDER BY createdat DESC
  `;
    return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
    await initDb();
    const { name, email, description } = await req.json();

    if (!name || !email || !description) {
        return NextResponse.json(
            { error: "Wszystkie pola są wymagane." },
            { status: 400 }
        );
    }

    // ustawiamy due_date 14 dni od teraz
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await sql`
    INSERT INTO claims (name, email, description, due_date)
   VALUES (${name}, ${email}, ${description}, ${dueDate.toISOString()});
  `;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: `"System reklamacji" <${process.env.SMTP_USER}>`,
        to: "konradwiel@interia.pl",
        subject: "Nowa reklamacja",
        text: `Nowa reklamacja od: ${name} (${email})\n\nOpis: ${description}\nKończy się: ${dueDate.toLocaleDateString()}`,
    });

    return NextResponse.json({ ok: true });
}
