"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SiteContent } from "@/lib/site/types";

export type ViewMode = "regular" | "admin";
export type SiteEditorSection =
  | "profile"
  | "hero"
  | "stats"
  | "about"
  | "photos"
  | "work"
  | "photography"
  | "brands"
  | "services"
  | "ugc"
  | "testimonials"
  | "cta";

export type AdminPanelTab = "content" | "portfolio";

type AdminViewContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  authenticated: boolean;
  authRequired: boolean;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  editorSection: SiteEditorSection | null;
  setEditorSection: (section: SiteEditorSection | null) => void;
  preferredTab: AdminPanelTab | null;
  clearPreferredTab: () => void;
  openSiteEditor: (section?: SiteEditorSection) => void;
  openPortfolioEditor: () => void;
  refreshSession: () => Promise<void>;
  site: SiteContent;
  setSite: (site: SiteContent) => void;
};

const AdminViewContext = createContext<AdminViewContextValue | null>(null);

const VIEW_MODE_KEY = "wunderful-view-mode";

type AdminViewProviderProps = {
  children: ReactNode;
  initialSite: SiteContent;
};

export function AdminViewProvider({
  children,
  initialSite,
}: AdminViewProviderProps) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "regular";
    const stored = window.localStorage.getItem(VIEW_MODE_KEY);
    return stored === "admin" || stored === "regular" ? stored : "regular";
  });
  const [authenticated, setAuthenticated] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editorSection, setEditorSection] = useState<SiteEditorSection | null>(null);
  const [preferredTab, setPreferredTab] = useState<AdminPanelTab | null>(null);
  const [site, setSite] = useState(initialSite);

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/admin/session");
    if (!response.ok) return;
    const data = (await response.json()) as {
      authenticated: boolean;
      authRequired: boolean;
    };
    setAuthenticated(data.authenticated);
    setAuthRequired(data.authRequired);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshSession();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshSession]);

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode);
      localStorage.setItem(VIEW_MODE_KEY, mode);
      if (mode === "regular") {
        setPanelOpen(false);
      }
    },
    [],
  );

  const clearPreferredTab = useCallback(() => {
    setPreferredTab(null);
  }, []);

  const openSiteEditor = useCallback((section?: SiteEditorSection) => {
    setEditorSection(section ?? null);
    setPreferredTab("content");
    setPanelOpen(true);
  }, []);

  const openPortfolioEditor = useCallback(() => {
    setEditorSection(null);
    setPreferredTab("portfolio");
    setPanelOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      viewMode,
      setViewMode,
      authenticated,
      authRequired,
      panelOpen,
      setPanelOpen,
      editorSection,
      setEditorSection,
      preferredTab,
      clearPreferredTab,
      openSiteEditor,
      openPortfolioEditor,
      refreshSession,
      site,
      setSite,
    }),
    [
      viewMode,
      setViewMode,
      authenticated,
      authRequired,
      panelOpen,
      editorSection,
      preferredTab,
      clearPreferredTab,
      openSiteEditor,
      openPortfolioEditor,
      refreshSession,
      site,
    ],
  );

  return (
    <AdminViewContext.Provider value={value}>{children}</AdminViewContext.Provider>
  );
}

export function useAdminView() {
  const context = useContext(AdminViewContext);
  if (!context) {
    throw new Error("useAdminView must be used within AdminViewProvider");
  }
  return context;
}

export function useSiteContent() {
  return useAdminView().site;
}
