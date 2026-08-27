"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import type { SiteContent } from "@/lib/site/types";
import type { ContentStoreSource } from "@/lib/storage/runtime";

export type ViewMode = "regular" | "admin";
export type SiteEditorSection =
  | "profile"
  | "hero"
  | "about"
  | "stats"
  | "work"
  | "services"
  | "photography"
  | "brands"
  | "testimonials"
  | "photos"
  | "ugc"
  | "cta";

export type SiteEditorFocus = {
  kind: "photography-photo";
  photoId: string;
};

export type AdminPanelTab = "content" | "portfolio";

export type EditorLocation = {
  tab: AdminPanelTab;
  section: SiteEditorSection;
  focus: SiteEditorFocus | null;
};

const DEFAULT_LOCATION: EditorLocation = {
  tab: "content",
  section: "profile",
  focus: null,
};

type AdminViewContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  authenticated: boolean;
  authRequired: boolean;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  location: EditorLocation;
  setEditorTab: (tab: AdminPanelTab) => void;
  setEditorSection: (section: SiteEditorSection) => void;
  clearEditorFocus: () => void;
  openSiteEditor: (
    section?: SiteEditorSection,
    focus?: SiteEditorFocus,
  ) => void;
  openPortfolioEditor: () => void;
  enterAdminView: () => void;
  completeAdminLogin: () => void;
  exitAdminView: () => Promise<void>;
  refreshSession: () => Promise<void>;
  site: SiteContent;
  setSite: Dispatch<SetStateAction<SiteContent>>;
  siteVersion: number;
  setSiteVersion: (version: number) => void;
  siteUpdatedAt: string;
  setSiteUpdatedAt: (updatedAt: string) => void;
  contentStore: ContentStoreSource;
};

const AdminViewContext = createContext<AdminViewContextValue | null>(null);

type AdminViewProviderProps = {
  children: ReactNode;
  initialSite: SiteContent;
  initialSiteVersion: number;
  initialSiteUpdatedAt: string;
  initialContentStore: ContentStoreSource;
  initialAuthenticated: boolean;
  initialAuthRequired: boolean;
};

export function AdminViewProvider({
  children,
  initialSite,
  initialSiteVersion,
  initialSiteUpdatedAt,
  initialContentStore,
  initialAuthenticated,
  initialAuthRequired,
}: AdminViewProviderProps) {
  const router = useRouter();
  const [viewMode, setViewModeState] = useState<ViewMode>(() =>
    initialAuthRequired && initialAuthenticated ? "admin" : "regular",
  );
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [authRequired, setAuthRequired] = useState(initialAuthRequired);
  const [panelOpen, setPanelOpen] = useState(false);
  const [location, setLocation] = useState<EditorLocation>(DEFAULT_LOCATION);
  const [site, setSite] = useState(initialSite);
  const [siteVersion, setSiteVersion] = useState(initialSiteVersion);
  const [siteUpdatedAt, setSiteUpdatedAt] = useState(initialSiteUpdatedAt);
  const [contentStore] = useState(initialContentStore);

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/admin/session");
    if (!response.ok) return;
    const data = (await response.json()) as {
      authenticated: boolean;
      authRequired: boolean;
    };
    setAuthenticated(data.authenticated);
    setAuthRequired(data.authRequired);
    if (data.authRequired && !data.authenticated) {
      setViewModeState("regular");
      setPanelOpen(false);
    }
  }, []);

  useEffect(() => {
    let idleId = 0;
    let timeoutId = 0;
    const run = () => {
      void refreshSession();
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run, { timeout: 4000 });
    } else {
      timeoutId = window.setTimeout(run, 2500);
    }

    return () => {
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [refreshSession]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    if (mode === "regular") {
      setPanelOpen(false);
    }
  }, []);

  const enterAdminView = useCallback(() => {
    setViewModeState("admin");
    setPanelOpen(true);
  }, []);

  const completeAdminLogin = useCallback(() => {
    setAuthenticated(true);
    setViewModeState("admin");
    setPanelOpen(true);
  }, []);

  const exitAdminView = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setViewModeState("regular");
    setPanelOpen(false);
    router.refresh();
  }, [router]);

  const setEditorTab = useCallback((tab: AdminPanelTab) => {
    setLocation((current) => ({ ...current, tab, focus: null }));
  }, []);

  const setEditorSection = useCallback((section: SiteEditorSection) => {
    setLocation((current) => ({
      ...current,
      tab: "content",
      section,
      focus: null,
    }));
  }, []);

  const clearEditorFocus = useCallback(() => {
    setLocation((current) => ({ ...current, focus: null }));
  }, []);

  const openSiteEditor = useCallback(
    (section?: SiteEditorSection, focus?: SiteEditorFocus) => {
      setLocation({
        tab: "content",
        section: section ?? "profile",
        focus: focus ?? null,
      });
      setPanelOpen(true);
    },
    [],
  );

  const openPortfolioEditor = useCallback(() => {
    setLocation((current) => ({
      ...current,
      tab: "portfolio",
      focus: null,
    }));
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
      location,
      setEditorTab,
      setEditorSection,
      clearEditorFocus,
      openSiteEditor,
      openPortfolioEditor,
      enterAdminView,
      completeAdminLogin,
      exitAdminView,
      refreshSession,
      site,
      setSite,
      siteVersion,
      setSiteVersion,
      siteUpdatedAt,
      setSiteUpdatedAt,
      contentStore,
    }),
    [
      viewMode,
      setViewMode,
      authenticated,
      authRequired,
      panelOpen,
      location,
      setEditorTab,
      setEditorSection,
      clearEditorFocus,
      openSiteEditor,
      openPortfolioEditor,
      enterAdminView,
      completeAdminLogin,
      exitAdminView,
      refreshSession,
      site,
      siteVersion,
      siteUpdatedAt,
      setSiteUpdatedAt,
      contentStore,
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
