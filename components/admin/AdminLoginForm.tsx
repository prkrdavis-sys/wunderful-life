"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

      const next = searchParams.get("next") ?? "/admin";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-green/30 bg-white/80 p-6 backdrop-blur-sm"
    >
      <label className="block text-sm">
        <span className="font-medium text-brown">Admin password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-xl border border-brown/20 bg-cream px-3 py-2 text-brown outline-none focus:border-green"
          required
          autoComplete="current-password"
        />
      </label>

      {error && (
        <p className="mt-4 rounded-xl bg-pink/20 px-4 py-2 text-sm text-brown">
          {error}
        </p>
      )}

      <div className="mt-6">
        <AnimatedButton type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </AnimatedButton>
      </div>
    </form>
  );
}
