"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import {
  useAdminView,
  type AdminPanelTab,
} from "@/components/admin/AdminViewProvider";
import { EditorPanelIcon } from "@/components/ui/EditorPanelIcon";
import { confirmLeaveDuringUpload } from "@/lib/admin/uploadGuard";

const AdminDashboard = dynamic(
  () =>
    import("@/components/admin/AdminDashboard").then(
      (module) => module.AdminDashboard,
    ),
  {
    ssr: false,
    loading: () => <p className="px-4 py-6 text-sm text-muted">Loading videos…</p>,
  },
);

const SiteEditorForm = dynamic(
  () =>
    import("@/components/admin/SiteEditorForm").then(
      (module) => module.SiteEditorForm,
    ),
  { ssr: false },
);

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

export function AdminModePanel() {
  const {
    viewMode,
    authenticated,
    authRequired,
    panelOpen,
    setPanelOpen,
    location,
    setEditorTab,
  } = useAdminView();
  const [videos, setVideos] = useState<PortfolioVideo[]>([]);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const canEdit = authenticated || !authRequired;
  const isOpen = viewMode === "admin" && panelOpen && canEdit;
  const activeTab = location.tab;

  const tryClosePanel = () => {
    if (!confirmLeaveDuringUpload(uploadBusy)) return;
    setUploadBusy(false);
    setPanelOpen(false);
  };

  const trySetTab = (next: AdminPanelTab) => {
    if (!confirmLeaveDuringUpload(uploadBusy)) return;
    if (next !== "portfolio") setUploadBusy(false);
    setEditorTab(next);
  };

  useEffect(() => {
    if (!uploadBusy) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [uploadBusy]);

  useEffect(() => {
    if (!isOpen || videosLoaded) return;

    void fetch("/api/videos", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: PortfolioVideo[]) => {
        setVideos(data);
        setVideosLoaded(true);
      });
  }, [isOpen, videosLoaded]);

  useEffect(() => {
    if (viewMode !== "admin") {
      setPanelOpen(false);
    }
  }, [viewMode, setPanelOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const { style: htmlStyle } = document.documentElement;
    const { style: bodyStyle } = document.body;

    htmlStyle.overflow = "hidden";
    htmlStyle.overscrollBehavior = "none";
    document.documentElement.classList.add("admin-editor-open");
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.left = "0";
    bodyStyle.right = "0";
    bodyStyle.width = "auto";
    bodyStyle.maxWidth = "100%";
    bodyStyle.overflow = "hidden";

    return () => {
      htmlStyle.overflow = "";
      htmlStyle.overscrollBehavior = "";
      document.documentElement.classList.remove("admin-editor-open");
      bodyStyle.position = "";
      bodyStyle.top = "";
      bodyStyle.left = "";
      bodyStyle.right = "";
      bodyStyle.width = "";
      bodyStyle.maxWidth = "";
      bodyStyle.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close admin editor"
            className="fixed inset-0 z-[60] bg-brown/30 backdrop-blur-[2px]"
            onClick={tryClosePanel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-editor-title"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="admin-editor-shell pointer-events-none fixed inset-0 z-[70]"
          >
            <div className="admin-editor-frame flex h-full min-h-0 min-w-0 flex-col">
              <div className="pointer-events-auto flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-brown/15 bg-paper shadow-2xl">
                <div className="flex min-w-0 shrink-0 flex-col gap-3 border-b border-brown/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:contents">
                  <div className="flex shrink-0 gap-1 rounded-full bg-cream p-1">
                    <button
                      type="button"
                      onClick={() => trySetTab("content")}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2 ${
                        activeTab === "content"
                          ? "bg-forest text-paper"
                          : "text-ink hover:bg-lavender/25"
                      }`}
                    >
                      Site
                    </button>
                    <button
                      type="button"
                      onClick={() => trySetTab("portfolio")}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2 ${
                        activeTab === "portfolio"
                          ? "bg-forest text-paper"
                          : "text-ink hover:bg-lavender/25"
                      }`}
                    >
                      Videos
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={tryClosePanel}
                    className="shrink-0 rounded-full border border-brown/20 px-3 py-1.5 text-sm text-brown hover:bg-cream sm:order-last"
                  >
                    Close
                  </button>
                </div>
                <h2
                  id="admin-editor-title"
                  className="min-w-0 truncate font-display text-lg text-brown sm:flex-1 sm:text-2xl"
                >
                  Edit portfolio
                </h2>
              </div>

              <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
                {activeTab === "content" ? (
                  <div className="flex h-full min-h-0 min-w-0 flex-col">
                    <SiteEditorForm
                      portfolioVideos={videos}
                      portfolioVideosLoaded={videosLoaded}
                      onUploadBusyChange={setUploadBusy}
                    />
                  </div>
                ) : (
                  <div className="flex h-full min-h-0 min-w-0 flex-col">
                    {videosLoaded ? (
                      <AdminDashboard
                        initialVideos={videos}
                        onVideosChange={setVideos}
                        onUploadBusyChange={setUploadBusy}
                      />
                    ) : (
                      <p className="px-4 py-6 text-sm text-muted">Loading videos…</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
