"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SectionLink } from "@/components/ui/SectionLink";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import type { HeroLink } from "@/lib/site/types";

export function SiteNav() {
  const site = useSiteContent();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

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

  return (
    <header
      ref={headerRef}
      className="glass-header relative z-10 border-b border-white/55"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
        <SectionLink
          href="/"
          aria-label={site.brand}
          className="group inline-flex shrink-0 items-center"
        >
          <BrandLogo
            alt={site.brand}
            sizes="56px"
            preload
            className="h-12 w-auto origin-left mix-blend-multiply transition duration-200 group-hover:opacity-80 sm:h-14"
          />
        </SectionLink>

        <nav className="hidden items-center gap-5 md:flex">
          {site.heroLinks.map((link) => (
            <SectionLink
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-forest ${
                isActive(link) ? "text-forest" : "text-ink/85"
              }`}
            >
              {link.label}
            </SectionLink>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-lg border border-white/50 bg-white/20 px-3 py-2 text-sm text-ink backdrop-blur-sm md:hidden"
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
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-white/20 hover:text-forest"
                >
                  {link.label}
                </SectionLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
