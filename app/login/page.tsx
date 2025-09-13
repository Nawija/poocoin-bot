"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            setLoading(false);

            if (res.ok) {
                // pełne przeładowanie strony do strony głównej
                window.location.href = "/";
            } else {
                const data = await res.json();
                setError(data.error);
            }
        } catch (err) {
            setLoading(false);
            setError("Błąd sieci. Spróbuj ponownie.");
        }
    }

    return (
        <div className="flex items-center justify-center pt-24 md:pt-48 mx-5">
            <form
                onSubmit={handleLogin}
                className="bg-white p-6 rounded shadow-md w-96"
            >
                <h2 className="text-xl font-bold mb-4">Logowanie</h2>
                {error && (
                    <div className="text-red-700 mb-2 border-y border-red-200 bg-red-50 py-1 flex items-center justify-center">
                        <TriangleAlert size={18} className="mr-2" />
                        <p>{error}</p>
                    </div>
                )}
                <input
                    className="border border-zinc-300 rounded p-2 mb-3 w-full"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    className="border border-zinc-300 rounded p-2 mb-3 w-full"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="bg-sky-600 text-white px-4 py-2 w-full rounded hover:bg-sky-700 flex justify-center items-center"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            <p>Loading...</p>
                        </div>
                    ) : (
                        "Log in"
                    )}
                </button>
            </form>
        </div>
    );
}
