import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function GET() {
    await initDb();

    const today = new Date();
    const reminderDays = [1, 2];

    const claims = await sql`SELECT * FROM claims`;

    const transporter = nodemailer.createTransport({
        service: "gmail", // <<< uproszczenie, działa z App Password
        auth: {
            user: process.env.EMAIL_USER, // np. infokwbot@gmail.com
            pass: process.env.EMAIL_PASS, // hasło aplikacyjne
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
                from: `"System Reklamacji" <${process.env.EMAIL_USER}>`,
                to: "reklamacje.siedlce@mebloo.pl",
                subject: `Reklamacja klienta ${claim.name} zbliża się do końca`,
                text: `Reklamacja od ${claim.name} (${claim.email})\nOpis: ${
                    claim.description
                }\nReklamacja kończy sie za ${diffDays} dni i nie została odrzucona`,
            });
            sentCount++;
        }
    }

    return NextResponse.json({ ok: true, sent: sentCount });
}
