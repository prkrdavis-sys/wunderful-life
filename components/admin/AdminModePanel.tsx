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
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed top-1/2 left-1/2 z-[70] flex h-[min(88vh,52rem)] w-[min(92vw,42rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-brown/15 bg-paper shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-brown/10 px-5 py-4">
              <div>
                <p className="font-label text-xs font-semibold tracking-[0.2em] text-pink-deep uppercase">
                  Admin mode
                </p>
                <h2
                  id="admin-editor-title"
                  className="font-display text-2xl text-brown"
                >
                  Edit portfolio
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-full border border-brown/20 px-3 py-1.5 text-sm text-brown hover:bg-cream"
              >
                Close
              </button>
            </div>

            <div className="flex gap-2 border-b border-brown/10 px-5 py-3">
              <button
                type="button"
                onClick={() => setTab("content")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === "content"
                    ? "bg-burgundy text-paper"
                    : "bg-cream text-indigo hover:bg-lavender/25"
                }`}
              >
                Site content
              </button>
              <button
                type="button"
                onClick={() => setTab("portfolio")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === "portfolio"
                    ? "bg-burgundy text-paper"
                    : "bg-cream text-indigo hover:bg-lavender/25"
                }`}
              >
                Videos
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {tab === "content" ? (
                <div className="flex h-full min-h-0 flex-col px-5">
                  <SiteEditorForm key={site.fullName + site.tagline} initial={site} />
                </div>
              ) : (
                <div className="h-full overflow-y-auto overscroll-contain px-5 py-6">
                  {videosLoaded ? (
                    <AdminDashboard initialVideos={videos} />
                  ) : (
                    <p className="text-sm text-muted">Loading videos…</p>
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
