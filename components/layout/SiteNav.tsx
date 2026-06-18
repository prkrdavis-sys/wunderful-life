"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SectionLink } from "@/components/ui/SectionLink";
import { EditorPanelIcon } from "@/components/ui/EditorPanelIcon";
import { AdminLoginInline } from "@/components/admin/AdminLoginInline";
import { useAdminView, useSiteContent } from "@/components/admin/AdminViewProvider";
import type { HeroLink } from "@/lib/site/types";

export function SiteNav() {
  const site = useSiteContent();
  const pathname = usePathname();
  const router = useRouter();
  const {
    viewMode,
    setViewMode,
    authenticated,
    authRequired,
    panelOpen,
    setPanelOpen,
    refreshSession,
  } = useAdminView();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adminOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(event.target as Node)
      ) {
        setAdminOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [adminOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  const isActive = (link: HeroLink) =>
    link.activePathPrefix
      ? pathname.startsWith(link.activePathPrefix)
      : false;

  const handleRegularView = () => {
    setViewMode("regular");
    setPanelOpen(false);
    setAdminOpen(false);
    setMenuOpen(false);
  };

  const handleAdminView = () => {
    setViewMode("admin");
    setAdminOpen(false);
    setMenuOpen(false);
  };

  const openEditorPanel = () => {
    setPanelOpen(true);
    setAdminOpen(false);
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    await refreshSession();
    setViewMode("regular");
    setPanelOpen(false);
    setAdminOpen(false);
    setMenuOpen(false);
    router.refresh();
  };

  const viewMenuItems = (
    <>
      <button
        type="button"
        onClick={handleRegularView}
        className={`block w-full px-4 py-3 text-left text-sm font-medium transition hover:bg-white/25 ${
          viewMode === "regular" ? "text-burgundy" : "text-indigo"
        }`}
      >
        Regular view {viewMode === "regular" ? "✓" : ""}
      </button>

      <div className="border-t border-white/35">
        <button
          type="button"
          onClick={handleAdminView}
          className={`block w-full px-4 py-3 text-left text-sm font-medium transition hover:bg-white/25 ${
            viewMode === "admin" ? "text-burgundy" : "text-indigo"
          }`}
        >
          Admin view {viewMode === "admin" ? "✓" : ""}
        </button>

        {viewMode === "admin" && (
          <div className="mx-3 mb-3 space-y-2">
            {authRequired && !authenticated ? (
              <div className="overflow-hidden rounded-xl border border-burgundy/20 bg-burgundy/8 p-3">
                <p className="mb-2 text-xs font-medium text-indigo/85">
                  Sign in to open the editing panel
                </p>
                <AdminLoginInline />
              </div>
            ) : (
              <button
                type="button"
                onClick={openEditorPanel}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                  panelOpen
                    ? "border-burgundy/35 bg-burgundy/12 shadow-inner"
                    : "border-burgundy/20 bg-white/40 hover:border-burgundy/35 hover:bg-white/55"
                }`}
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-burgundy/20 bg-paper/90 text-burgundy shadow-sm"
                >
                  <EditorPanelIcon />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-burgundy">
                    {panelOpen ? "Editing panel open" : "Open editing panel"}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-indigo/75">
                    Floats over the site — stays on this page
                  </span>
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {authenticated && (
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="block w-full border-t border-white/35 px-4 py-3 text-left text-sm font-medium text-indigo/70 transition hover:bg-white/25"
        >
          Sign out
        </button>
      )}
    </>
  );

  return (
    <header
      ref={headerRef}
      className="glass-header relative z-10 border-b border-white/55"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <SectionLink href="/" className="group flex flex-col">
          <span className="font-display text-lg font-semibold text-indigo transition-colors group-hover:text-burgundy">
            {site.fullName}
          </span>
          <span className="text-xs tracking-widest text-indigo/60 uppercase">
            {site.brand}
          </span>
        </SectionLink>

        <nav className="hidden items-center gap-5 md:flex">
          {site.heroLinks.map((link) => (
            <SectionLink
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-burgundy ${
                isActive(link) ? "text-burgundy" : "text-indigo/85"
              }`}
            >
              {link.label}
            </SectionLink>
          ))}

          <div ref={adminMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAdminOpen((open) => !open)}
              className={`flex items-center gap-1 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition ${
                viewMode === "admin"
                  ? "border-burgundy/40 bg-burgundy/10 text-burgundy"
                  : "border-white/50 bg-white/20 text-indigo backdrop-blur-sm hover:border-burgundy/35 hover:bg-white/30"
              }`}
              aria-expanded={adminOpen}
              aria-haspopup="true"
            >
              Menu
              <span className="text-xs" aria-hidden>
                ▾
              </span>
            </button>
            <AnimatePresence>
              {adminOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="glass-panel absolute right-0 z-20 mt-2 min-w-[260px] overflow-hidden rounded-2xl border border-white/50"
                >
                  {viewMenuItems}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <button
          type="button"
          className="rounded-lg border border-white/50 bg-white/20 px-3 py-2 text-sm text-indigo backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
        >
          Menu
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/30 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {site.heroLinks.map((link) => (
                <SectionLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-indigo hover:bg-white/20 hover:text-burgundy"
                >
                  {link.label}
                </SectionLink>
              ))}
              <div className="glass-panel mt-2 overflow-hidden rounded-xl border border-white/50">
                {viewMenuItems}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
