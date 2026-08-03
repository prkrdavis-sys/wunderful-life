"use client";

import { SectionLink } from "@/components/ui/SectionLink";
import { useSiteContent } from "@/components/admin/AdminViewProvider";

export function SiteFooter() {
  const site = useSiteContent();

  return (
    <footer className="relative border-t border-lavender/25 bg-paper/70 py-12 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p className="font-display text-ink">
          {site.fullName} · {site.brand}
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-ink/75">
          <SectionLink href="/#about" className="hover:text-forest">
            About
          </SectionLink>
          <SectionLink href="/work" className="hover:text-forest">
            Work
          </SectionLink>
          <SectionLink href="/#contact" className="hover:text-forest">
            Contact
          </SectionLink>
        </div>
        <p className="text-xs text-ink/60">
          © {new Date().getFullYear()} {site.brand}
        </p>
      </div>
    </footer>
  );
}
