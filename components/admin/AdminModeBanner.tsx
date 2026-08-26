"use client";

import { useAdminView } from "@/components/admin/AdminViewProvider";
import { EditorPanelIcon } from "@/components/ui/EditorPanelIcon";

function formatSavedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return "not yet saved to the database";
  }
  return `last saved ${date.toLocaleString()}`;
}

export function AdminModeBanner() {
  const {
    viewMode,
    setPanelOpen,
    exitAdminView,
    contentStore,
    siteVersion,
    siteUpdatedAt,
  } = useAdminView();

  if (viewMode !== "admin") return null;

  const live = contentStore === "database";

  return (
    <div className="relative z-0 border-b border-lavender/35 bg-forest/92 px-4 py-2 text-center text-sm text-paper backdrop-blur-sm">
      <span className="inline-flex flex-wrap items-center justify-center gap-2">
        <span>Admin view is on.</span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            live ? "bg-paper/20 text-paper" : "bg-blush/80 text-brown"
          }`}
        >
          {live
            ? `Live from your saved site · v${siteVersion} · ${formatSavedAt(siteUpdatedAt)}`
            : "Local files only — not the live site"}
        </span>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-paper/35 bg-paper/15 px-3 py-1.5 text-sm font-semibold text-paper transition hover:bg-paper/25"
        >
          <EditorPanelIcon className="h-3.5 w-3.5 shrink-0 opacity-95" />
          Open editing panel
        </button>
        <button
          type="button"
          onClick={() => void exitAdminView()}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-paper/80 underline-offset-2 transition hover:text-paper hover:underline"
        >
          Exit Admin View
        </button>
      </span>
    </div>
  );
}
