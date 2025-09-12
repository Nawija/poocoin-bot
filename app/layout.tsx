import "./globals.css";
import { ReactNode } from "react";
import Link from "next/link";
import { Mail, Settings } from "lucide-react";

export const metadata = {
    title: "Reklamacje",
    description: "Prosty planogram reklamacji z wysyłką maili",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="pl">
            <body>
                <header className="bg-white shadow-sm">
                    <div className=" py-4 px-4 max-w-7xl mx-auto flex items-center justify-between">
                        <p className="hidden md:flex"></p>
                        <Link href="/">
                            <div className="relative -mt-4">
                                <h1 className="text-2xl text-sky-600 font-bold">
                                    REKLAMACJE
                                </h1>
                                <p className="absolute right-0 -bottom-3 text-[11px]">
                                    by Konrad Wielgórski
                                </p>
                            </div>
                        </Link>
                        <nav className="space-x-4 flex items-center justify-center">
                            <Link
                                className="text-slate-600 hover:text-slate-900"
                                href="/"
                            >
                                <Mail />
                            </Link>
                            <Link
                                className="text-slate-600 hover:text-slate-900"
                                href="/"
                            >
                                <Settings />
                            </Link>
                        </nav>
                    </div>
                </header>

                <main className="bg-gradient-to-t from-slate-50 to-blue-50">
                    {children}
                </main>

                <footer className="mt-12 py-8 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} Konrad Wielgóski — prosty
                    system reklamacji
                </footer>
            </body>
        </html>
    );
}
