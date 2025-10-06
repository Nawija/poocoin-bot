"use client";
import React from "react";
import { Clock4, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Claim = {
    id: number;
    name: string;
    email: string;
    description: string;
    created_at: string;
    due_date?: string;
};

export default function HomePage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        description: "",
        due_date: "",
    });
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingClaims, setLoadingClaims] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // automatyczne chowanie komunikatu po 2s
    useEffect(() => {
        if (msg) {
            const timer = setTimeout(() => setMsg(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [msg]);

    async function loadClaims() {
        setLoadingClaims(true);
        const res = await fetch("/api/claim");
        if (res.ok) {
            const data = await res.json();
            setClaims(data);
        }
        setLoadingClaims(false);
    }

    const [history, setHistory] = useState<Claim[]>([]);

    async function loadHistory() {
        const res = await fetch("/api/claim/history");
        if (res.ok) {
            const data = await res.json();
            setHistory(data);
        }
    }

    async function completeClaim(id: number) {
        if (!confirm("Na pewno oznaczyć tę reklamację jako zrealizowaną?"))
            return;
        const res = await fetch(`/api/claim/complete/${id}`, {
            method: "POST",
        });
        if (res.ok) {
            setMsg("Reklamacja została zrealizowana.");
            await loadClaims();
            await loadHistory();
        } else {
            setMsg("Błąd przy realizacji reklamacji.");
        }
    }

    useEffect(() => {
        loadClaims();
        loadHistory();
    }, []);

    async function submit(e: React.FormEvent) {
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
            setMsg("Reklamacja dodana.");
            setForm({ name: "", email: "", description: "", due_date: "" });
            loadClaims();
        } else {
            const err = await res.json();
            setMsg("Błąd: " + (err?.error || "nieznany"));
        }
    }

    async function deleteClaim(id: number) {
        if (!confirm("Na pewno usunąć tę reklamację?")) return;
        const res = await fetch(`/api/claim/${id}`, { method: "DELETE" });
        if (res.ok) {
            setMsg("Reklamacja została usunięta.");
            loadClaims();
        } else {
            setMsg("Błąd przy usuwaniu reklamacji.");
        }
    }

    async function deleteHistory(id: number) {
        if (!confirm("Na pewno usunąć tę historię reklamacji?")) return;
        const res = await fetch(`/api/claim/history/${id}`, {
            method: "DELETE",
        });
        if (res.ok) {
            setMsg("Historia reklamacji została usunięta.");
            await loadHistory();
        } else {
            setMsg("Błąd przy usuwaniu historii.");
        }
    }

    return (
        <>
            <AnimatePresence>
                {msg && (
                    <motion.div
                        key="msg"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`mb-4 text-sm absolute w-full h-10 font-bold text-center flex items-center justify-center
                        ${
                            msg.includes("Reklamacja dodana") ||
                            msg.includes("Reklamacja została usunięta")
                                ? "text-green-600 bg-green-100/90 border-y border-green-300"
                                : "text-yellow-600 bg-yellow-100/90 border-y border-amber-300"
                        }`}
                    >
                        <TriangleAlert className="mr-2" />
                        <p>{msg}</p>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="mx-auto p-6 flex md:items-start md:justify-center md:flex-row flex-col items-center justify-center max-w-7xl md:space-x-6 md:space-y-0 space-y-8 transition-all">
                {/* FORMULARZ */}

                <section className="w-full ">
                    <h2 className="text-xl font-semibold mb-4">
                        Dodaj reklamację
                    </h2>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <form onSubmit={submit} className="grid gap-3">
                            <input
                                className="border border-zinc-300/90 rounded px-3 py-2"
                                placeholder="Imię i nazwisko klienta"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                required
                            />
                            <input
                                className="border border-zinc-300/90 rounded px-3 py-2"
                                placeholder="E-mail klienta"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                type="email"
                                required
                            />
                            <textarea
                                className="border border-zinc-300/90 rounded px-3 py-2 min-h-[100px]"
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
                                    className="border border-zinc-300/90 rounded px-3 py-2 w-full"
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
                                    className="px-3 py-2 border border-yellow-500 text-white rounded cursor-pointer bg-yellow-500 hover:bg-yellow-500 transition"
                                >
                                    <Clock4 />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    className="bg-sky-600 text-white transition-colors px-4 py-2 rounded hover:bg-sky-700 cursor-pointer flex items-center justify-center"
                                    type="submit"
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
                                    className="px-4 py-2 border border-zinc-300/90 rounded cursor-pointer"
                                >
                                    <span>Wyczyść</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* LISTA REKLAMACJI */}
                <section className="w-full">
                    <div className="flex items-start justify-start">
                        <h3 className="text-xl font-semibold mb-4">
                            Lista reklamacji
                        </h3>
                        {claims.length > 0 && (
                            <div className="h-5 w-5 flex items-center justify-center bg-red-600 rounded-full ml-1">
                                <p className="text-xs text-white font-bold">
                                    {claims.length}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-6">
                        {loadingClaims && (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        {!loadingClaims && claims.length === 0 && (
                            <div className="text-slate-500">
                                Brak reklamacji
                            </div>
                        )}
                        {!loadingClaims &&
                            claims.map((c) => (
                                <div
                                    key={c.id}
                                    className="bg-white p-4 rounded shadow-sm flex justify-between items-start"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {c.name}{" "}
                                            <span className="text-sm text-slate-500">
                                                ({c.email})
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-700 mt-1">
                                            {c.description}
                                        </div>

                                        <div className="text-sm mt-1">
                                            Termin:{" "}
                                            {c.due_date
                                                ? (() => {
                                                      const daysLeft =
                                                          Math.ceil(
                                                              (new Date(
                                                                  c.due_date
                                                              ).getTime() -
                                                                  new Date().getTime()) /
                                                                  (1000 *
                                                                      60 *
                                                                      60 *
                                                                      24)
                                                          );

                                                      let colorClass =
                                                          "text-slate-500"; // domyślny
                                                      if (
                                                          daysLeft >= 8 &&
                                                          daysLeft <= 14
                                                      ) {
                                                          colorClass =
                                                              "text-green-600";
                                                      } else if (
                                                          daysLeft >= 4 &&
                                                          daysLeft <= 7
                                                      ) {
                                                          colorClass =
                                                              "text-yellow-600";
                                                      } else if (
                                                          daysLeft >= 1 &&
                                                          daysLeft <= 3
                                                      ) {
                                                          colorClass =
                                                              "text-red-600";
                                                      } else if (
                                                          daysLeft <= 0
                                                      ) {
                                                          colorClass =
                                                              "text-red-800 font-bold"; // termin minął
                                                      }

                                                      return (
                                                          <>
                                                              {new Date(
                                                                  c.due_date
                                                              ).toLocaleDateString(
                                                                  "pl-PL"
                                                              )}{" "}
                                                              <span
                                                                  className={
                                                                      colorClass
                                                                  }
                                                              >
                                                                  ({daysLeft}{" "}
                                                                  dni)
                                                              </span>
                                                          </>
                                                      );
                                                  })()
                                                : "—"}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => completeClaim(c.id)}
                                            className="bg-green-600 hover:bg-green-700 transition-colors cursor-pointer text-white text-xs font-bold p-2 rounded"
                                        >
                                            Zrealizuj
                                        </button>
                                        <button
                                            onClick={() => deleteClaim(c.id)}
                                            className="ml-4 bg-red-500 hover:bg-red-600 transition-colors cursor-pointer text-white text-xs font-bold p-2 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>
            </div>
            <section className="w-full mt-10 p-6 max-w-7xl mx-auto">
                <h3 className="text-xl font-semibold mb-4">
                    Historia reklamacji
                </h3>
                {history.length === 0 ? (
                    <p className="text-slate-500">
                        Brak zrealizowanych reklamacji
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded shadow-sm border border-slate-200">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium text-slate-700">
                                        Klient
                                    </th>
                                    <th className="text-left px-4 py-2 font-medium text-slate-700">
                                        E-mail
                                    </th>
                                    <th className="text-left px-4 py-2 font-medium text-slate-700">
                                        Opis reklamacji
                                    </th>
                                    <th className="text-left px-4 py-2 font-medium text-slate-700">
                                        Dodano
                                    </th>
                                    <th className="text-left px-4 py-2 font-medium text-slate-700">
                                        Zrealizowano
                                    </th>
                                    <th className="px-4 py-2 font-medium text-slate-700">
                                        Akcje
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(
                                    history
                                        .sort(
                                            (a, b) =>
                                                new Date(
                                                    b.completed_at
                                                ).getTime() -
                                                new Date(
                                                    a.completed_at
                                                ).getTime()
                                        )
                                        .reduce<Record<string, Claim[]>>(
                                            (acc, h) => {
                                                const date = new Date(
                                                    h.completed_at
                                                );
                                                const month =
                                                    date.toLocaleString(
                                                        "pl-PL",
                                                        {
                                                            month: "long",
                                                            year: "numeric",
                                                        }
                                                    );
                                                if (!acc[month])
                                                    acc[month] = [];
                                                acc[month].push(h);
                                                return acc;
                                            },
                                            {}
                                        )
                                ).map(([month, items]) => (
                                    <React.Fragment key={month}>
                                        <tr className="w-full bg-slate-100  font-semibold text-slate-700">
                                            <td
                                                colSpan={6}
                                                className="px-4 py-2"
                                            >
                                                <p className="relative w-max">
                                                    {month
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        month.slice(1)}
                                                    <span className="ml-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full absolute -right-6 -top-1.5">
                                                        {items.length}
                                                    </span>
                                                </p>
                                            </td>
                                        </tr>
                                        {items.map((h) => (
                                            <tr
                                                key={h.id}
                                                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-4 py-2">
                                                    {h.name}
                                                </td>
                                                <td className="px-4 py-2 text-slate-500">
                                                    {h.email}
                                                </td>
                                                <td className="px-4 py-2 text-slate-700">
                                                    {h.description}
                                                </td>
                                                <td className="px-4 py-2 text-slate-500">
                                                    {new Date(
                                                        h.created_at
                                                    ).toLocaleDateString(
                                                        "pl-PL"
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-slate-500">
                                                    {new Date(
                                                        h.completed_at
                                                    ).toLocaleDateString(
                                                        "pl-PL"
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() =>
                                                            deleteHistory(h.id)
                                                        }
                                                        className="bg-red-500 hover:bg-red-600 transition-colors cursor-pointer text-white text-xs font-bold p-2 rounded"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}
