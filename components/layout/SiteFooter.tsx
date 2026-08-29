"use client";

import { AdminUnlockButton } from "@/components/admin/AdminUnlockButton";
import { useSiteContent } from "@/components/admin/AdminViewProvider";

export function SiteFooter() {
  const site = useSiteContent();

  return (
    <footer className="glass-footer relative z-20 border-t border-lavender/25 bg-paper/70 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 sm:px-6">
        <div className="flex items-center gap-3 text-xs text-ink/60">
          <p>
            © {new Date().getFullYear()} {site.brand}
          </p>
          <AdminUnlockButton />
        </div>
      </div>
    </footer>
  );
}
