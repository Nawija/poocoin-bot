"use client";
import { useEffect, useState } from "react";

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

    async function loadClaims() {
        setLoadingClaims(true);
        const res = await fetch("/api/claim");
        if (res.ok) {
            const data = await res.json();
            setClaims(data);
        }
        setLoadingClaims(false);
    }

    useEffect(() => {
        loadClaims();
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

    return (
        <div className="mx-auto p-6 flex md:items-start md:justify-center md:flex-row flex-col items-center justify-center max-w-7xl md:space-x-8 md:space-y-0 space-y-8">
            {/* FORMULARZ */}
            <section className="w-full ">
                <h2 className="text-xl font-semibold mb-4">
                    Dodaj nową reklamację
                </h2>
                <div className="bg-white p-6 rounded-lg shadow">
                    {msg && (
                        <div className="mb-4 text-sm text-emerald-600">
                            {msg}
                        </div>
                    )}

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
                        <input
                            type="date"
                            className="border border-zinc-300/90 rounded px-3 py-2"
                            value={form.due_date}
                            onChange={(e) =>
                                setForm({ ...form, due_date: e.target.value })
                            }
                            required
                        />

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
                                Wyczyść
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* LISTA REKLAMACJI */}
            <section className="w-full">
                <div className="flex items-start justify-start mb-4">
                    <h3 className="text-lg font-semibold">Lista reklamacji</h3>
                    <p className="text-xs ml-1">({claims.length})</p>
                </div>
                <div className="space-y-4 h-[70vh] overflow-y-scroll w-full pr-2">
                    {loadingClaims && (
                        <div className="flex justify-center py-4">
                            <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    {!loadingClaims && claims.length === 0 && (
                        <div className="text-slate-500">Brak reklamacji.</div>
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

                                    <div className="text-sm text-red-500 mt-1">
                                        Termin:{" "}
                                        {c.due_date ? (
                                            <>
                                                {new Date(
                                                    c.due_date
                                                ).toLocaleDateString("pl-PL")}
                                                {"  "}
                                                <span className="text-slate-500">
                                                    (
                                                    {Math.ceil(
                                                        (new Date(
                                                            c.due_date
                                                        ).getTime() -
                                                            new Date().getTime()) /
                                                            (1000 * 60 * 60 * 24)
                                                    )}{" "}
                                                    dni)
                                                </span>
                                            </>
                                        ) : (
                                            "—"
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteClaim(c.id)}
                                    className="ml-4 bg-red-500 hover:bg-red-600 transition-colors cursor-pointer text-white text-xs font-bold px-2 py-1 rounded"
                                >
                                    Usuń
                                </button>
                            </div>
                        ))}
                </div>
            </section>
        </div>
    );
}
