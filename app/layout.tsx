import "./globals.css";
import { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Reklamacje",
  description: "Prosty planogram reklamacji z wysyłką maili",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <header className="bg-white shadow-sm">
          <div className="container py-4 flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-semibold text-sky-600">Reklamacje</h1>
            </Link>
            <nav className="space-x-4">
              <Link className="text-slate-600 hover:text-slate-900" href="/">Strona główna</Link>
              <Link className="text-slate-600 hover:text-slate-900" href="/settings">Ustawienia SMTP</Link>
            </nav>
          </div>
        </header>

        <main className="container py-8">{children}</main>

        <footer className="mt-12 py-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Twoja Firma — prosty system reklamacji
        </footer>
      </body>
    </html>
  );
}
