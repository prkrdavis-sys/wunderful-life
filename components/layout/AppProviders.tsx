"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { SiteContent } from "@/lib/site/types";
import type { ContentStoreSource } from "@/lib/storage/runtime";
import { AdminViewProvider } from "@/components/admin/AdminViewProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

const AdminModePanel = dynamic(
  () =>
    import("@/components/admin/AdminModePanel").then(
      (module) => module.AdminModePanel,
    ),
  { ssr: false },
);

type AppProvidersProps = {
  children: ReactNode;
  initialSite: SiteContent;
  initialSiteVersion: number;
  initialSiteUpdatedAt: string;
  initialContentStore: ContentStoreSource;
  initialAuthenticated: boolean;
  initialAuthRequired: boolean;
};

export function AppProviders({
  children,
  initialSite,
  initialSiteVersion,
  initialSiteUpdatedAt,
  initialContentStore,
  initialAuthenticated,
  initialAuthRequired,
}: AppProvidersProps) {
  return (
    <AdminViewProvider
      initialSite={initialSite}
      initialSiteVersion={initialSiteVersion}
      initialSiteUpdatedAt={initialSiteUpdatedAt}
      initialContentStore={initialContentStore}
      initialAuthenticated={initialAuthenticated}
      initialAuthRequired={initialAuthRequired}
    >
      {children}
      <AdminModePanel />
      <ServiceWorkerRegister />
    </AdminViewProvider>
  );
}
