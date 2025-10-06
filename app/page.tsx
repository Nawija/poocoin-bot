"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock4, Trash2, X } from "lucide-react";

// === Typy ===
type Claim = {
    id: number;
    name: string;
    email: string;
    description: string;
    created_at: string;
    completed_at?: string;
    due_date?: string;
};

type FormData = {
    name: string;
    email: string;
    description: string;
    due_date: string;
};

// === Komponent główny ===
export default function HomePage() {
    const [form, setForm] = useState<FormData>({
        name: "",
        email: "",
        description: "",
        due_date: "",
    });
    const [claims, setClaims] = useState<Claim[]>([]);
    const [history, setHistory] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingClaims, setLoadingClaims] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // === Efekt: automatyczne ukrycie wiadomości po 2s ===
    useEffect(() => {
        if (!msg) return;
        const timer = setTimeout(() => setMsg(null), 2000);
        return () => clearTimeout(timer);
    }, [msg]);

    // === Pobieranie danych ===
    async function loadClaims() {
        setLoadingClaims(true);
        const res = await fetch("/api/claim");
        if (res.ok) setClaims(await res.json());
        setLoadingClaims(false);
    }

    async function loadHistory() {
        const res = await fetch("/api/claim/history");
        if (res.ok) setHistory(await res.json());
    }

    async function refreshData() {
        await Promise.all([loadClaims(), loadHistory()]);
    }

    useEffect(() => {
        refreshData();
    }, []);

    // === Obsługa formularza ===
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        const res = await fetch("/api/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        setLoading(false);

        if (res.ok) {
            setMsg("✅ Reklamacja dodana.");
            setForm({ name: "", email: "", description: "", due_date: "" });
            await loadClaims();
        } else {
            const err = await res.json().catch(() => ({}));
            setMsg("❌ Błąd: " + (err?.error || "nieznany"));
        }
    }

    // === Akcje na reklamacjach ===
    async function completeClaim(id: number) {
        if (!confirm("Na pewno oznaczyć tę reklamację jako zrealizowaną?"))
            return;
        const res = await fetch(`/api/claim/complete/${id}`, {
            method: "POST",
        });
        if (res.ok) {
            setMsg("✅ Reklamacja została zrealizowana.");
            await refreshData();
        } else setMsg("❌ Błąd przy realizacji reklamacji.");
    }

    async function deleteClaim(id: number) {
        if (!confirm("Na pewno usunąć tę reklamację?")) return;
        const res = await fetch(`/api/claim/${id}`, { method: "DELETE" });
        if (res.ok) {
            setMsg("🗑️ Reklamacja została usunięta.");
            await loadClaims();
        } else setMsg("❌ Błąd przy usuwaniu reklamacji.");
    }

    async function deleteHistory(id: number) {
        if (!confirm("Na pewno usunąć tę historię reklamacji?")) return;
        const res = await fetch(`/api/claim/history/${id}`, {
            method: "DELETE",
        });
        if (res.ok) {
            setMsg("🗑️ Historia reklamacji została usunięta.");
            await loadHistory();
        } else setMsg("❌ Błąd przy usuwaniu historii.");
    }

    // === Pomocnicze ===
    function getDaysLeft(dueDate: string): { text: string; color: string } {
        const daysLeft = Math.ceil(
            (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        let color = "text-slate-500";

        if (daysLeft <= 0) color = "text-red-800 font-bold";
        else if (daysLeft <= 3) color = "text-red-600";
        else if (daysLeft <= 7) color = "text-yellow-600";
        else if (daysLeft <= 14) color = "text-green-600";

        return { text: `${daysLeft} dni`, color };
    }

    // === Widok ===
    return (
        <>
            {/* Komunikaty */}
            <AnimatePresence>
                {msg && (
                    <motion.div
                        key="msg"
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.9 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 text-sm font-medium
                ${
                    msg.includes("✅") || msg.includes("🗑️")
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : msg.includes("❌")
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                }`}
                    >
                        {msg.includes("✅") && (
                            <Check className="text-green-700" size={18} />
                        )}
                        {msg.includes("🗑️") && (
                            <Trash2 className="text-green-700" size={18} />
                        )}
                        {msg.includes("❌") && (
                            <X className="text-red-700" size={18} />
                        )}
                        <span>{msg.replace(/[✅❌🗑️]/g, "")}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mx-auto p-6 max-w-7xl flex flex-col md:flex-row gap-8 transition-all">
                {/* === FORMULARZ === */}
                <section className="w-full md:w-1/2">
                    <h2 className="text-xl font-semibold mb-4">
                        Dodaj reklamację
                    </h2>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <form onSubmit={handleSubmit} className="grid gap-3">
                            <input
                                className="border border-zinc-300 rounded px-3 py-2"
                                placeholder="Imię i nazwisko klienta"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                required
                            />
                            <input
                                className="border border-zinc-300 rounded px-3 py-2"
                                placeholder="E-mail klienta"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                required
                            />
                            <textarea
                                className="border border-zinc-300 rounded px-3 py-2 min-h-[100px]"
                                placeholder="Opis reklamacji"
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                                required
                            />
                            <div className="flex gap-2 items-center">
                                <input
                                    type="date"
                                    className="border border-zinc-300 rounded px-3 py-2 w-full"
                                    value={form.due_date}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            due_date: e.target.value,
                                        })
                                    }
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm({
                                            ...form,
                                            due_date: new Date()
                                                .toISOString()
                                                .split("T")[0],
                                        })
                                    }
                                    className="px-3 py-2 border border-yellow-500 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition cursor-pointer"
                                >
                                    <Clock4 />
                                </button>
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button
                                    type="submit"
                                    className="bg-sky-600 text-white cursor-pointer px-4 py-2 rounded hover:bg-sky-700 transition flex items-center justify-center"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Wysyłam...</span>
                                        </div>
                                    ) : (
                                        "Dodaj"
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm({
                                            name: "",
                                            email: "",
                                            description: "",
                                            due_date: "",
                                        })
                                    }
                                    className="px-4 py-2 border border-zinc-300 cursor-pointer rounded hover:bg-zinc-50 transition"
                                >
                                    Wyczyść
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* === LISTA REKLAMACJI === */}
                <section className="w-full md:w-1/2">
                    <div className="flex items-center mb-4">
                        <h3 className="text-xl font-semibold">
                            Lista reklamacji
                        </h3>
                        {claims.length > 0 && (
                            <span className="ml-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {claims.length}
                            </span>
                        )}
                    </div>

                    {loadingClaims ? (
                        <div className="flex justify-center py-6">
                            <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : claims.length === 0 ? (
                        <p className="text-slate-500">Brak reklamacji</p>
                    ) : (
                        <div className="space-y-4">
                            {claims.map((c) => {
                                const due = c.due_date
                                    ? getDaysLeft(c.due_date)
                                    : { text: "—", color: "text-slate-400" };

                                return (
                                    <div
                                        key={c.id}
                                        className="bg-white p-4 rounded shadow-sm flex justify-between items-start hover:shadow-md transition"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {c.name}{" "}
                                                <span className="text-sm text-slate-500">
                                                    ({c.email})
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700 mt-1">
                                                {c.description}
                                            </p>
                                            <p className="text-sm mt-1">
                                                Termin:{" "}
                                                {c.due_date
                                                    ? new Date(
                                                          c.due_date
                                                      ).toLocaleDateString(
                                                          "pl-PL"
                                                      )
                                                    : "—"}{" "}
                                                <span className={due.color}>
                                                    ({due.text})
                                                </span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() =>
                                                    completeClaim(c.id)
                                                }
                                                className="bg-green-600 hover:bg-green-700 cursor-pointer text-white p-2 rounded transition"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    deleteClaim(c.id)
                                                }
                                                className="bg-red-500 hover:bg-red-600 cursor-pointer text-white p-2 rounded transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {/* === HISTORIA === */}
            <section className="w-full mt-10 p-6 max-w-7xl mx-auto">
                <h3 className="text-2xl font-semibold mb-6 text-slate-800">
                    Historia reklamacji
                </h3>

                {history.length === 0 ? (
                    <p className="text-slate-500 text-start py-10">
                        Brak zrealizowanych reklamacji
                    </p>
                ) : (
                    Object.entries(
                        history
                            .sort(
                                (a, b) =>
                                    new Date(b.completed_at || "").getTime() -
                                    new Date(a.completed_at || "").getTime()
                            )
                            .reduce<Record<string, Claim[]>>((acc, h) => {
                                const month = new Date(
                                    h.completed_at || ""
                                ).toLocaleString("pl-PL", {
                                    month: "long",
                                    year: "numeric",
                                });
                                acc[month] = acc[month] || [];
                                acc[month].push(h);
                                return acc;
                            }, {})
                    ).map(([month, items]) => (
                        <div key={month} className="mb-6">
                            <div className="flex items-center mb-2">
                                <h4 className="text-lg font-semibold text-slate-700 capitalize">
                                    {month}
                                </h4>
                                <span className="ml-2 text-gray-600">
                                    ({items.length})
                                </span>
                            </div>
                            <div className="bg-white rounded-xl divide-y divide-slate-200 shadow-sm">
                                {items.map((h) => (
                                    <div
                                        key={h.id}
                                        className="flex items-start justify-between px-4 py-3 even:bg-gray-50 hover:bg-sky-50 transition"
                                    >
                                        <span className="flex-1 text-slate-800">
                                            {h.name}
                                        </span>
                                        <span className="flex-1 text-slate-500">
                                            {h.email}
                                        </span>
                                        <span className="flex-2 text-slate-700">
                                            {h.description}
                                        </span>
                                        <span className="flex-1 text-slate-500">
                                            {new Date(
                                                h.created_at
                                            ).toLocaleDateString("pl-PL")}
                                        </span>
                                        <span className="flex-1 text-slate-500">
                                            {new Date(
                                                h.completed_at || ""
                                            ).toLocaleDateString("pl-PL")}
                                        </span>
                                        <button
                                            onClick={() => deleteHistory(h.id)}
                                            className="ml-4 text-red-500 hover:text-red-600 transition cursor-pointer"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </section>
        </>
    );
}
