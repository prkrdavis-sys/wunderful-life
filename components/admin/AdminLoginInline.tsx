"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";

export function AdminLoginInline() {
  const router = useRouter();
  const { refreshSession, setViewMode } = useAdminView();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Login failed.");
      }

      await refreshSession();
      setViewMode("admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4">
      <p className="text-xs leading-relaxed text-indigo/70">
        Sign in to edit portfolio content on this page.
      </p>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Admin password"
        className="w-full rounded-xl border border-lavender/40 bg-paper px-3 py-2 text-sm text-indigo outline-none focus:border-burgundy/50"
        required
        autoComplete="current-password"
      />
      {error && (
        <p className="rounded-lg bg-pink/15 px-3 py-2 text-xs text-burgundy">{error}</p>
      )}
      <AnimatedButton type="submit" disabled={loading} className="w-full justify-center">
        {loading ? "Signing in…" : "Sign in"}
      </AnimatedButton>
    </form>
  );
}
