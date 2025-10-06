import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function POST(req: Request) {
    await initDb();
    const { month } = await req.json(); // np. "październik 2025"

    // 🔹 Pobieramy wszystkie zrealizowane reklamacje z danego miesiąca
    const claims =
        await sql`SELECT * FROM claims_history WHERE completed_at IS NOT NULL`;

    const filtered = claims.rows.filter((c) => {
        const completedMonth = new Date(c.completed_at).toLocaleString(
            "pl-PL",
            {
                month: "long",
                year: "numeric",
            }
        );
        return completedMonth.toLowerCase() === month.toLowerCase();
    });

    if (filtered.length === 0)
        return NextResponse.json({
            ok: false,
            message: "Brak reklamacji w tym miesiącu.",
        });

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const emailBody = filtered
        .map(
            (c, i) =>
                `${i + 1}. ${c.name} (${c.email})\nOpis: ${
                    c.description
                }\nData zgłoszenia reklamacji: ${new Date(c.created_at).toLocaleDateString(
                    "pl-PL"
                )}\nZakończona: ${new Date(c.completed_at).toLocaleDateString(
                    "pl-PL"
                )}\n`
        )
        .join("\n-----------------------------\n");

    await transporter.sendMail({
        from: `"System Reklamacji" <${process.env.EMAIL_USER}>`,
        to: "kwielgorski@mebloo.pl",
        // to: "konradwiel@interia.pl",
        subject: `Zestawienie reklamacji - ${month}`,
        text: `Reklamacje w miesiącu ${month}:\n\n${emailBody}`,
    });

    return NextResponse.json({ ok: true, sent: filtered.length });
}
