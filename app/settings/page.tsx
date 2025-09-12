"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
    const [form, setForm] = useState({
        smtpHost: "smtp.gmail.com",
        smtpPort: "465",
        smtpSecure: "true",
        smtpEmail: "",
        smtpPass: "",
    });
    const [msg, setMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                if (data?.smtp_host) {
                    setForm({
                        smtpHost: data.smtp_host,
                        smtpPort: String(data.smtp_port),
                        smtpSecure: String(data.smtp_secure),
                        smtpEmail: data.smtp_email || "",
                        smtpPass: data.smtp_pass || "",
                    });
                }
            }
        })();
    }, []);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        const res = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                smtp_host: form.smtpHost,
                smtp_port: Number(form.smtpPort),
                smtp_secure: form.smtpSecure === "true",
                smtp_email: form.smtpEmail,
                smtp_pass: form.smtpPass,
            }),
        });

        setLoading(false);
        if (res.ok) setMsg("Zapisano ustawienia.");
        else {
            const err = await res.json();
            setMsg("Błąd: " + (err?.error || "nieznany"));
        }
    }

    return (
        <div>
            <section className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Ustawienia SMTP</h2>
                <form onSubmit={save} className="grid gap-3">
                    <input
                        value={form.smtpHost}
                        onChange={(e) =>
                            setForm({ ...form, smtpHost: e.target.value })
                        }
                        placeholder="Host SMTP"
                        className="border rounded px-3 py-2"
                        required
                    />
                    <input
                        value={form.smtpPort}
                        onChange={(e) =>
                            setForm({ ...form, smtpPort: e.target.value })
                        }
                        placeholder="Port SMTP"
                        className="border rounded px-3 py-2"
                        required
                    />
                    <select
                        value={form.smtpSecure}
                        onChange={(e) =>
                            setForm({ ...form, smtpSecure: e.target.value })
                        }
                        className="border rounded px-3 py-2"
                    >
                        <option value="true">secure (SSL/TLS)</option>
                        <option value="false">insecure (STARTTLS)</option>
                    </select>
                    <input
                        value={form.smtpEmail}
                        onChange={(e) =>
                            setForm({ ...form, smtpEmail: e.target.value })
                        }
                        placeholder="Adres e-mail"
                        className="border rounded px-3 py-2"
                        required
                    />
                    <input
                        value={form.smtpPass}
                        onChange={(e) =>
                            setForm({ ...form, smtpPass: e.target.value })
                        }
                        placeholder="Hasło SMTP"
                        type="password"
                        className="border rounded px-3 py-2"
                        required
                    />
                    <div className="flex gap-3">
                        <button
                            disabled={loading}
                            className="bg-sky-600 text-white px-4 py-2 rounded"
                        >
                            {loading ? "Zapis..." : "Zapisz ustawienia"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setForm({
                                    smtpHost: "smtp.gmail.com",
                                    smtpPort: "465",
                                    smtpSecure: "true",
                                    smtpEmail: "",
                                    smtpPass: "",
                                });
                            }}
                            className="px-4 py-2 border rounded"
                        >
                            Reset
                        </button>
                    </div>
                </form>
                {msg && (
                    <div className="mt-3 text-sm text-slate-700">{msg}</div>
                )}
            </section>
            <p className="mt-6 text-sm text-slate-500">
                Uwaga: najlepiej użyć konta SMTP przeznaczonego dla aplikacji
                (SendGrid, Resend, Postmark lub dedykowany SMTP). Gmail może
                wymagać ustawienia hasła aplikacji.
            </p>
        </div>
    );
}
