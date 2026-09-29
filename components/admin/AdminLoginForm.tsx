"use client";

import { useRef, useState, type FormEvent } from "react";

type AdminLoginFormProps = {
  initialError: string | null;
};

export function AdminLoginForm({ initialError }: AdminLoginFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const candidate = password.trim();
    if (!candidate) {
      setError("Enter the password to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: candidate }),
        credentials: "same-origin",
      });

      if (response.ok) {
        window.location.assign("/?admin=1");
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Invalid password.");
      setSubmitting(false);
    } catch {
      // The network call failed rather than the password, so fall back to the
      // plain form post instead of blaming the password.
      formRef.current?.submit();
    }
  }

  return (
    <form
      ref={formRef}
      method="post"
      action="/api/admin/login"
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-brown/15 bg-paper p-5 shadow-2xl"
    >
      <h1 className="font-display text-xl text-brown">Admin</h1>
      <p className="mt-1 text-sm text-ink/70">
        Enter the password to edit this site.
      </p>
      <input
        id="admin-password"
        name="password"
        type={revealed ? "text" : "password"}
        placeholder="Password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          if (error) setError(null);
        }}
        className="mt-4 w-full min-w-0 rounded-xl border border-lavender/40 bg-cream py-2 px-3 text-base text-ink outline-none focus:border-forest/50"
        autoComplete="current-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      {error ? (
        <p className="mt-3 rounded-lg bg-blush/15 px-3 py-2 text-xs text-forest">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setRevealed((current) => !current)}
          className="text-xs text-ink/55 underline decoration-dotted transition hover:text-ink/80"
        >
          {revealed ? "Hide password" : "Show password"}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-paper transition hover:bg-forest-deep disabled:opacity-60"
        >
          {submitting ? "Unlocking…" : "Unlock"}
        </button>
      </div>
    </form>
  );
}
