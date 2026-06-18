"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLoginInline } from "@/components/admin/AdminLoginInline";
import { SiteEditorForm } from "@/components/admin/SiteEditorForm";
import { useAdminView } from "@/components/admin/AdminViewProvider";

type AdminTab = "content" | "portfolio";

export function AdminModeBanner() {
  const { viewMode, authenticated, authRequired, setPanelOpen } = useAdminView();

  if (viewMode !== "admin") return null;

  const needsLogin = authRequired && !authenticated;

  return (
    <div className="relative z-0 border-b border-lavender/35 bg-burgundy/92 px-4 py-2 text-center text-sm text-paper backdrop-blur-sm">
      {needsLogin ? (
        <span>Admin view — sign in from the Menu to make edits.</span>
      ) : (
        <span>
          Admin mode active.{" "}
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="font-semibold underline underline-offset-2"
          >
            Open editor
          </button>
        </span>
      )}
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
    site,
  } = useAdminView();
  const [tab, setTab] = useState<AdminTab>("content");
  const [videos, setVideos] = useState<PortfolioVideo[]>([]);
  const [videosLoaded, setVideosLoaded] = useState(false);

  const canEdit = authenticated || !authRequired;
  const isOpen = viewMode === "admin" && panelOpen && canEdit;

  useEffect(() => {
    if (!isOpen || videosLoaded) return;

    void fetch("/api/videos")
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
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.left = "0";
    bodyStyle.right = "0";
    bodyStyle.width = "100%";
    bodyStyle.overflow = "hidden";

    return () => {
      htmlStyle.overflow = "";
      bodyStyle.position = "";
      bodyStyle.top = "";
      bodyStyle.left = "";
      bodyStyle.right = "";
      bodyStyle.width = "";
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
            onClick={() => setPanelOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-editor-title"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-3 z-[70] flex flex-col overflow-hidden rounded-2xl border border-brown/15 bg-paper shadow-2xl sm:inset-4 md:inset-6 lg:inset-8"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-brown/10 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h2
                  id="admin-editor-title"
                  className="font-display text-xl text-brown sm:text-2xl"
                >
                  Edit portfolio
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-1 rounded-full bg-cream p-1">
                  <button
                    type="button"
                    onClick={() => setTab("content")}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2 ${
                      tab === "content"
                        ? "bg-burgundy text-paper"
                        : "text-indigo hover:bg-lavender/25"
                    }`}
                  >
                    Site
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("portfolio")}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2 ${
                      tab === "portfolio"
                        ? "bg-burgundy text-paper"
                        : "text-indigo hover:bg-lavender/25"
                    }`}
                  >
                    Videos
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="rounded-full border border-brown/20 px-3 py-1.5 text-sm text-brown hover:bg-cream"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {tab === "content" ? (
                <div className="flex h-full min-h-0 flex-col">
                  <SiteEditorForm />
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col">
                  {videosLoaded ? (
                    <AdminDashboard
                      initialVideos={videos}
                      onVideosChange={setVideos}
                    />
                  ) : (
                    <p className="py-6 text-sm text-muted">Loading videos…</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AdminModeGate() {
  const { viewMode, authenticated, authRequired, setPanelOpen } = useAdminView();

  if (viewMode !== "admin" || !authRequired || authenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border border-brown/15 bg-white p-1 shadow-xl">
      <div className="rounded-xl bg-cream/80 p-1">
        <AdminLoginInline />
        <button
          type="button"
          onClick={() => setPanelOpen(false)}
          className="mt-1 w-full rounded-lg py-2 text-xs text-muted hover:bg-white"
        >
          Stay in preview only
        </button>
      </div>
    </div>
  );
}
