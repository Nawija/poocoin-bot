import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
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

    // ustawiamy createdat (teraz) i due_date (za 14 dni)
    const createdAt = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await sql`
    INSERT INTO claims (name, email, description, createdat, due_date)
    VALUES (${name}, ${email}, ${description}, ${createdAt.toISOString()}, ${dueDate.toISOString()});
  `;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"System reklamacji" <${process.env.EMAIL_USER}>`,
        to: "reklamacje.siedlce@mebloo.pl",
        subject: "Nowa reklamacja",
        text: `Nowa reklamacja od: ${name} (${email})
    
Opis: ${description}

Dodana: ${createdAt.toLocaleDateString()}
Kończy się: ${dueDate.toLocaleDateString()}`,
    });

    return NextResponse.json({ ok: true });
}
