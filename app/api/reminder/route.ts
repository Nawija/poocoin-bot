import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function GET() {
    await initDb();

    const today = new Date();
    const reminderDays = [10, 13];

    const claims = await sql`
    SELECT * FROM claims
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

    let sentCount = 0;

    for (const claim of claims.rows) {
        if (!claim.due_date) continue;

        const due = new Date(claim.due_date);
        const diffDays = Math.floor(
            (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (reminderDays.includes(diffDays)) {
            await transporter.sendMail({
                from: `"System Reklamacji" <${process.env.SMTP_USER}>`,
                to: "konradwiel@interia.pl",
                subject: `Przypomnienie: Reklamacja klienta ${claim.name} zbliża się do końca`,
                text: `Reklamacja od ${claim.name} (${claim.email})\nOpis: ${
                    claim.description
                }\nKończy się za ${diffDays} dni: ${due.toLocaleDateString()}`,
            });
            sentCount++;
        }
    }

    return NextResponse.json({ ok: true, sent: sentCount });
}
