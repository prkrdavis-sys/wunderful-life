"use client";

import { useAdminView } from "@/components/admin/AdminViewProvider";
import { EditorPanelIcon } from "@/components/ui/EditorPanelIcon";

export function AdminModeBanner() {
  const { viewMode, setPanelOpen, exitAdminView } = useAdminView();

  if (viewMode !== "admin") return null;

  return (
    <div className="relative z-0 border-b border-lavender/35 bg-forest/92 px-4 py-2 text-center text-sm text-paper backdrop-blur-sm">
      <span className="inline-flex flex-wrap items-center justify-center gap-2">
        <span>Admin view is on.</span>
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
