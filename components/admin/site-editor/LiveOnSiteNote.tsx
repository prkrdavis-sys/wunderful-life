import type { ReactNode } from "react";

export function LiveOnSiteNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex max-w-full items-start gap-1.5 rounded-full bg-lavender/35 px-2.5 py-1 text-xs font-medium break-words text-ink">
      <span aria-hidden>🌸</span>
      {children}
    </p>
  );
}
