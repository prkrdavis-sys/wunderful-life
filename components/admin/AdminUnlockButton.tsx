"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";

export function AdminUnlockButton() {
  const router = useRouter();
  const {
    viewMode,
    authenticated,
    authRequired,
    enterAdminView,
    refreshSession,
  } = useAdminView();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (viewMode === "admin") return null;

  const handleOpen = () => {
    if (!authRequired || authenticated) {
      enterAdminView();
      return;
    }

    setError(null);
    setPassword("");
    setOpen(true);
  };

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
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Login failed.");
      }

      await refreshSession();
      enterAdminView();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-[11px] tracking-wide text-ink/35 transition hover:text-ink/55"
      >
        Admin
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  aria-label="Close admin login"
                  className="absolute inset-0 bg-brown/30 backdrop-blur-[2px]"
                  onClick={() => setOpen(false)}
                />
                <motion.form
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="admin-unlock-title"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  onSubmit={handleSubmit}
                  className="relative w-full max-w-sm rounded-2xl border border-brown/15 bg-paper p-5 shadow-2xl"
                >
                  <h2
                    id="admin-unlock-title"
                    className="font-display text-xl text-brown"
                  >
                    Admin
                  </h2>
                  <p className="mt-1 text-sm text-ink/70">
                    Enter the password to edit this site.
                  </p>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    className="mt-4 w-full rounded-xl border border-lavender/40 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-forest/50"
                    required
                    autoComplete="current-password"
                    autoFocus
                  />
                  {error && (
                    <p className="mt-3 rounded-lg bg-blush/15 px-3 py-2 text-xs text-forest">
                      {error}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-full px-3 py-2 text-sm text-ink/70 hover:bg-cream"
                    >
                      Cancel
                    </button>
                    <AnimatedButton type="submit" disabled={loading}>
                      {loading ? "Unlocking…" : "Unlock"}
                    </AnimatedButton>
                  </div>
                </motion.form>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
