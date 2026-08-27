"use client";

import { AdminUnlockButton } from "@/components/admin/AdminUnlockButton";
import { useSiteContent } from "@/components/admin/AdminViewProvider";

export function SiteFooter() {
  const site = useSiteContent();

  return (
    <footer className="relative border-t border-lavender/25 bg-paper/70 py-5 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 sm:px-6">
        <p className="flex items-center gap-3 text-xs text-ink/60">
          <span>
            © {new Date().getFullYear()} {site.brand}
          </span>
          <AdminUnlockButton />
        </p>
      </div>
    </footer>
  );
}
