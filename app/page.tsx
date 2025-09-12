"use client";
import { useEffect, useState } from "react";

type Claim = {
  id: number;
  name: string;
  email: string;
  description: string;
  created_at: string;
};

export default function HomePage() {
  const [form, setForm] = useState({ name: "", email: "", description: "" });
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadClaims() {
    const res = await fetch("/api/claim");
    if (res.ok) {
      const data = await res.json();
      setClaims(data);
    }
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
      setMsg("Reklamacja dodana i wysłano potwierdzenie e-mail.");
      setForm({ name: "", email: "", description: "" });
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
    <div>
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Dodaj nową reklamację</h2>

        {msg && <div className="mb-4 text-sm text-slate-700">{msg}</div>}

        <form onSubmit={submit} className="grid gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Imię i nazwisko klienta"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="E-mail klienta"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            required
          />
          <textarea
            className="border rounded px-3 py-2 min-h-[100px]"
            placeholder="Opis reklamacji"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />

          <div className="flex items-center gap-3">
            <button
              className="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? "Wysyłam..." : "Dodaj i wyślij potwierdzenie"}
            </button>

            <button
              type="button"
              onClick={() =>
                setForm({ name: "", email: "", description: "" })
              }
              className="px-4 py-2 border rounded"
            >
              Wyczyść
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Lista reklamacji</h3>
        <div className="space-y-4">
          {claims.length === 0 && (
            <div className="text-slate-500">Brak reklamacji.</div>
          )}
          {claims.map((c) => (
            <div
              key={c.id}
              className="bg-white p-4 rounded shadow-sm flex justify-between items-start"
            >
              <div>
                <div className="font-medium">
                  {c.name}{" "}
                  <span className="text-sm text-slate-500">({c.email})</span>
                </div>
                <div className="text-sm text-slate-700 mt-1">
                  {c.description}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {c.created_at
                    ? new Date(c.created_at).toLocaleString("pl-PL")
                    : "—"}
                </div>
              </div>
              <button
                onClick={() => deleteClaim(c.id)}
                className="ml-4 bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
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
