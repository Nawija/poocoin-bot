"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    }

    return (
        <button
            onClick={handleLogout}
            className="text-red-700 hover:text-red-900 cursor-pointer"
        >
            <LogOut />
        </button>
    );
}
