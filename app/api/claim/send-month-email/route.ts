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
            date.setDate(date.getDate() - 13);

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

        // Obliczamy średni czas rozpatrzenia
        const totalDays = filtered.reduce((sum, c) => {
            const createdAt = new Date(c.created_at);
            const completedAt = new Date(c.completed_at);
            const days = Math.ceil(
                (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            return sum + days;
        }, 0);

        const avgDays = Math.round(totalDays / filtered.length);

        // Tworzymy wiersze tabeli
        const rows = filtered
            .map((c, i) => {
                const resultText =
                    c.completion_option === "other"
                        ? c.other_description
                        : c.completion_option === "positive"
                        ? "Uznana przez producenta"
                        : c.completion_option === "negative"
                        ? "Odrzucona"
                        : "—";

                const createdAt = new Date(c.created_at);
                const completedAt = new Date(c.completed_at);
                const daysToResolve =
                    Math.ceil(
                        (completedAt.getTime() - createdAt.getTime()) /
                            (1000 * 60 * 60 * 24)
                    ) + 1;

                return `
                    <tr style="background-color:${i % 2 === 0 ? "#fafafa" : "#ffffff"};">
                        <td style="padding:8px;text-align:center;">${i + 1}</td>
                        <td style="padding:8px;">${c.name}<br><small>${c.email}</small></td>
                        <td style="padding:8px;">${c.description}</td>
                        <td style="padding:8px;text-align:center;">${createdAt.toLocaleDateString("pl-PL")}</td>
                        <td style="padding:8px;text-align:center;">${completedAt.toLocaleDateString("pl-PL")}</td>
                        <td style="padding:8px;text-align:center;">${daysToResolve} dni</td>
                        <td style="padding:8px;text-align:center;font-weight:600;color:${
                            resultText === "Uznana przez producenta"
                                ? "green"
                                : resultText === "Odrzucona"
                                ? "red"
                                : "#555"
                        };">
                            ${resultText}
                        </td>
                    </tr>
                `;
            })
            .join("");

        const emailBody = `
            <div style="font-family:Arial,sans-serif; color:#333; line-height:1.5; max-width:1500px; margin:auto;">
                <h2 style="text-align:start; background:#f5f5f5; padding:12px; border-radius:6px;">
                    Zestawienie reklamacji ${month.toUpperCase()}
                </h2>

                <p style="font-size:16px; margin-top:10px;">
                    <strong>Liczba zrealizowanych reklamacji:</strong> ${filtered.length}<br>
                    <strong>Średni czas rozpatrzenia:</strong> ${avgDays} dni
                </p>

                <table style="width:100%; border-collapse:collapse; margin-top:20px; font-size:14px;">
                    <thead>
                        <tr style="background-color:#333; color:white;">
                            <th style="padding:10px;">#</th>
                            <th style="padding:10px;">Klient</th>
                            <th style="padding:10px;">Opis reklamacji</th>
                            <th style="padding:10px;">Data zgłoszenia</th>
                            <th style="padding:10px;">Data zakończenia</th>
                            <th style="padding:10px;">Rozpatrzono w</th>
                            <th style="padding:10px;">Wynik</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;

        await transporter.sendMail({
            from: `"System Reklamacji" <${process.env.EMAIL_USER}>`,
            // to: "konradwiel@interia.pl",
            to: "kwielgorski@mebloo.pl",
            subject: `Zestawienie reklamacji - ${month.toUpperCase()}`,
            html: emailBody,
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
