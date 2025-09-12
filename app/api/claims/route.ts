import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import nodemailer from "nodemailer";

type Body = {
    name: string;
    email: string;
    description: string;
};

export async function POST(req: Request) {
    try {
        const body: Body = await req.json();
        const { name, email, description } = body;

        if (!name || !email || !description) {
            return NextResponse.json(
                { error: "Brakuje danych" },
                { status: 400 }
            );
        }

        // Tworzymy tabelę claims jeśli nie istnieje
        await sql`
      CREATE TABLE IF NOT EXISTS claims (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

        // Wstawiamy reklamację
        await sql`INSERT INTO claims (name, email, description) VALUES (${name}, ${email}, ${description});`;

        // Pobieramy ustawienia SMTP
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

        const settings =
            await sql`SELECT * FROM settings ORDER BY id DESC LIMIT 1;`;
        if (settings.rows.length === 0) {
            return NextResponse.json(
                { error: "Brak ustawień SMTP. Ustaw je w Panelu Ustawień." },
                { status: 400 }
            );
        }
        const s = settings.rows[0];

        // Konfiguracja nodemailer
        const transporter = nodemailer.createTransport({
            host: s.smtp_host,
            port: s.smtp_port,
            secure: s.smtp_secure,
            auth: {
                user: s.smtp_email,
                pass: s.smtp_pass,
            },
        });

        // Wysyłka maila potwierdzającego klientowi
        const mailOptions = {
            from: `"Dział Reklamacji" <${s.smtp_email}>`,
            to: email,
            subject: "Potwierdzenie przyjęcia reklamacji",
            text: `Dzień dobry ${name},\n\nPrzyjęliśmy Twoją reklamację:\n\n"${description}"\n\nWkrótce się z Tobą skontaktujemy.\n\nPozdrawiamy,\nDział Reklamacji`,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json(
            { error: err?.message || "Błąd serwera" },
            { status: 500 }
        );
    }
}
