"use client";

import type { ReactNode } from "react";
import type { SiteContent } from "@/lib/site/types";
import { AdminViewProvider } from "@/components/admin/AdminViewProvider";
import { AdminModeGate, AdminModePanel } from "@/components/admin/AdminModePanel";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

type AppProvidersProps = {
  children: ReactNode;
  initialSite: SiteContent;
  initialSiteVersion: number;
};

export function AppProviders({
  children,
  initialSite,
  initialSiteVersion,
}: AppProvidersProps) {
  return (
    <AdminViewProvider
      initialSite={initialSite}
      initialSiteVersion={initialSiteVersion}
    >
      {children}
      <AdminModePanel />
      <AdminModeGate />
      <ServiceWorkerRegister />
    </AdminViewProvider>
  );
}
