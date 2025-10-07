import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function POST(req: Request) {
    try {
        await initDb();

        const { month } = await req.json(); // np. "październik 2025"
        if (!month) {
            return NextResponse.json({
                ok: false,
                message: "Nie podano miesiąca.",
            });
        }

        // Pobieramy wszystkie zrealizowane reklamacje
        const result =
            await sql`SELECT * FROM claims_history WHERE completed_at IS NOT NULL`;
        const claims = result.rows;

        // Filtrujemy po miesiącu z due_date - 13 dni
        const filtered = claims.filter((c) => {
            if (!c.due_date) return false;

            const date = new Date(c.due_date);
            date.setDate(date.getDate() - 13); // odejmujemy 13 dni

            const dueMonth = date.toLocaleString("pl-PL", {
                month: "long",
                year: "numeric",
            });

            return dueMonth.toLowerCase() === month.toLowerCase();
        });

        if (filtered.length === 0) {
            return NextResponse.json({
                ok: false,
                message: "Brak reklamacji w tym miesiącu.",
            });
        }

        // Konfiguracja maila
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Tworzymy HTML email
        const emailBody = filtered
            .map((c, i) => {
                const resultText =
                    c.completion_option === "other"
                        ? c.other_description
                        : c.completion_option === "positive"
                        ? "Pozytywnie"
                        : c.completion_option === "negative"
                        ? "Negatywnie"
                        : "—";

                const adjustedDueDate = new Date(c.due_date);
                adjustedDueDate.setDate(adjustedDueDate.getDate() - 13);

                return `
          <div style="margin-bottom:20px; padding:6px; border-bottom:1px solid #ccc;">
            <p><strong>#${i + 1} Klient:</strong> ${c.name} (${c.email})</p>
            <p><strong>Opis reklamacji:</strong> ${c.description}</p>
            
            <p><strong>Data zgłoszenia:</strong> ${adjustedDueDate.toLocaleDateString(
                "pl-PL"
            )}</p>
            <p><strong>Data zakończenia:</strong> ${new Date(
                c.created_at
            ).toLocaleDateString("pl-PL")}</p>
            <p><strong>Wynik:</strong> ${resultText}</p>
          </div>
        `;
            })
            .join("");

        await transporter.sendMail({
            from: `"System Reklamacji" <${process.env.EMAIL_USER}>`,
            to: "kwielgorski@mebloo.pl",
            subject: `Zestawienie reklamacji - ${month}`,
            html: `
        <div style="font-family:Arial,sans-serif; line-height:1.5; color:#333;">
          <h2>Zestawienie reklamacji w miesiącu ${month}</h2>
          ${emailBody}
        </div>
      `,
        });

        return NextResponse.json({ ok: true, sent: filtered.length });
    } catch (err) {
        console.error("Błąd przy wysyłaniu maila:", err);
        return NextResponse.json({
            ok: false,
            message: "Wystąpił błąd podczas wysyłania maila.",
            error: err instanceof Error ? err.message : String(err),
        });
    }
}
