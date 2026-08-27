"use client";

import { usePathname } from "next/navigation";
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
      <div className="flex w-full items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <SectionLink
          href="/"
          className="group flex min-w-0 shrink items-center gap-2.5 sm:gap-3"
        >
          <BrandLogo
            alt=""
            sizes="56px"
            loading="eager"
            className="h-12 w-auto shrink-0 transition duration-200 group-hover:opacity-80 sm:h-14"
          />
          <span className="flex min-w-0 flex-col">
            <span className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-forest">
              {site.fullName}
            </span>
            <span className="text-xs tracking-widest text-ink/60 uppercase">
              {site.brand}
            </span>
          </span>
        </SectionLink>

        <nav className="ml-auto hidden shrink-0 items-center gap-4 md:flex lg:gap-6">
          {site.heroLinks.map((link) => (
            <SectionLink
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap text-sm font-medium transition-colors hover:text-forest ${
                isActive(link) ? "text-forest" : "text-ink/85"
              }`}
            >
              {link.label}
            </SectionLink>
          ))}
        </nav>

        <button
          type="button"
          className="ml-auto shrink-0 rounded-lg border border-white/50 bg-white/20 px-3 py-2 text-sm text-ink backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
        >
          Menu
        </button>
      </div>

      {menuOpen ? (
        <nav className="border-t border-white/30 md:hidden">
          <div className="flex flex-col gap-1 px-4 py-3 sm:px-6">
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
        </nav>
      ) : null}
    </header>
  );
}
