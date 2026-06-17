"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { SectionLink } from "@/components/ui/SectionLink";
import { AdminLoginInline } from "@/components/admin/AdminLoginInline";
import { useAdminView } from "@/components/admin/AdminViewProvider";

type NavLink = {
  label: string;
  href: string;
};

type SiteNavProps = {
  fullName: string;
  brand: string;
  links: NavLink[];
};

export function SiteNav({ fullName, brand, links }: SiteNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    viewMode,
    setViewMode,
    authenticated,
    authRequired,
    setPanelOpen,
    refreshSession,
  } = useAdminView();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/#work") {
      return pathname.startsWith("/work");
    }
    return false;
  };

  const handleRegularView = () => {
    setViewMode("regular");
    setPanelOpen(false);
    setAdminOpen(false);
    setMenuOpen(false);
  };

  const handleAdminView = () => {
    setViewMode("admin");
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
        className={`block w-full px-4 py-3 text-left text-sm font-medium transition hover:bg-green/10 ${
          viewMode === "regular" ? "text-green-deep" : "text-brown"
        }`}
      >
        Regular view {viewMode === "regular" ? "✓" : ""}
      </button>
      <button
        type="button"
        onClick={handleAdminView}
        className={`block w-full px-4 py-3 text-left text-sm font-medium transition hover:bg-pink/10 ${
          viewMode === "admin" ? "text-pink-deep" : "text-brown"
        }`}
      >
        Admin view {viewMode === "admin" ? "✓" : ""}
      </button>
      {viewMode === "admin" && authenticated && (
        <button
          type="button"
          onClick={() => {
            setPanelOpen(true);
            setAdminOpen(false);
            setMenuOpen(false);
          }}
          className="block w-full border-t border-brown/10 px-4 py-3 text-left text-sm font-medium text-brown transition hover:bg-cream"
        >
          Open editor
        </button>
      )}
      {authRequired && !authenticated && (
        <div className="border-t border-brown/10">
          <AdminLoginInline />
        </div>
      )}
      {authenticated && (
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="block w-full border-t border-brown/10 px-4 py-3 text-left text-sm font-medium text-muted transition hover:bg-cream"
        >
          Sign out
        </button>
      )}
      <SectionLink
        href="/admin"
        onClick={() => {
          setAdminOpen(false);
          setMenuOpen(false);
        }}
        className="block border-t border-brown/10 px-4 py-3 text-sm font-medium text-brown transition hover:bg-cream"
      >
        Legacy admin page
      </SectionLink>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-lavender/30 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <SectionLink href="/" className="group flex flex-col">
          <span className="font-display text-lg font-semibold text-brown transition-colors group-hover:text-green-deep">
            {fullName}
          </span>
          <span className="text-xs tracking-widest text-muted uppercase">
            {brand}
          </span>
        </SectionLink>

        <nav className="hidden items-center gap-5 md:flex">
          {links.map((link) => (
            <SectionLink
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-pink-deep ${
                isActive(link.href) ? "text-green-deep" : "text-brown"
              }`}
            >
              {link.label}
            </SectionLink>
          ))}

          <div className="relative">
            <button
              type="button"
              onClick={() => setAdminOpen((open) => !open)}
              className={`flex items-center gap-1 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition ${
                viewMode === "admin"
                  ? "border-green/40 bg-green/10 text-green-deep"
                  : "border-brown/15 bg-white/70 text-brown hover:border-pink"
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
                  className="absolute right-0 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-brown/10 bg-white shadow-xl"
                >
                  {viewMenuItems}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <button
          type="button"
          className="rounded-lg border border-brown/20 px-3 py-2 text-sm text-brown md:hidden"
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
            className="overflow-hidden border-t border-brown/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {links.map((link) => (
                <SectionLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-brown hover:bg-green/10"
                >
                  {link.label}
                </SectionLink>
              ))}
              <div className="mt-2 rounded-xl border border-brown/10 bg-cream/40">
                {viewMenuItems}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
