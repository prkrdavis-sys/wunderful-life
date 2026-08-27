"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {visible ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1A10.7 10.7 0 0 1 12 5c5.5 0 9.5 4.5 10.5 7-.4 1-1.2 2.3-2.4 3.5" />
          <path d="M6.6 6.6C4.7 8 3.4 9.8 3 12c1 2.5 5 7 9 7 1.3 0 2.6-.4 3.8-1" />
        </>
      ) : (
        <>
          <path d="M2.5 12S6.5 5 12 5s9.5 7 9.5 7-4 7-9.5 7S2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function AdminUnlockButton() {
  const {
    viewMode,
    authenticated,
    authRequired,
    enterAdminView,
    completeAdminLogin,
    refreshSession,
  } = useAdminView();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const readPassword = (form?: HTMLFormElement) => {
    const fromForm = form
      ? String(new FormData(form).get("password") ?? "")
      : "";
    const fromDom = passwordRef.current?.value ?? fromForm;
    return fromDom.normalize("NFC").replace(/^\uFEFF/, "").trim();
  };

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
    setShowPassword(false);
    setOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedPassword = readPassword(event.currentTarget);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password: submittedPassword }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Login failed.");
      }

      await refreshSession();
      completeAdminLogin();
      setOpen(false);
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
                  <div className="relative mt-4">
                    <input
                      ref={passwordRef}
                      id="admin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="w-full min-w-0 rounded-xl border border-lavender/40 bg-cream py-2 pl-3 pr-12 text-base text-ink outline-none focus:border-forest/50"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = passwordRef.current;
                        const current = input?.value ?? "";
                        setShowPassword((visible) => !visible);
                        requestAnimationFrame(() => {
                          if (input) input.value = current;
                        });
                      }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink/45 transition hover:text-ink/75"
                    >
                      <PasswordVisibilityIcon visible={showPassword} />
                    </button>
                  </div>
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
