"use client";

import type { ReactNode } from "react";
import type { SiteContent } from "@/lib/site/types";
import { AdminViewProvider } from "@/components/admin/AdminViewProvider";
import { AdminModePanel } from "@/components/admin/AdminModePanel";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

type AppProvidersProps = {
  children: ReactNode;
  initialSite: SiteContent;
  initialSiteVersion: number;
  initialAuthenticated: boolean;
  initialAuthRequired: boolean;
};

export function AppProviders({
  children,
  initialSite,
  initialSiteVersion,
  initialAuthenticated,
  initialAuthRequired,
}: AppProvidersProps) {
  return (
    <AdminViewProvider
      initialSite={initialSite}
      initialSiteVersion={initialSiteVersion}
      initialAuthenticated={initialAuthenticated}
      initialAuthRequired={initialAuthRequired}
    >
      {children}
      <AdminModePanel />
      <ServiceWorkerRegister />
    </AdminViewProvider>
  );
}
