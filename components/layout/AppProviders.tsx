"use client";

import type { ReactNode } from "react";
import type { SiteContent } from "@/lib/site/types";
import { AdminViewProvider } from "@/components/admin/AdminViewProvider";
import {
  AdminModeBanner,
  AdminModeGate,
  AdminModePanel,
} from "@/components/admin/AdminModePanel";

type AppProvidersProps = {
  children: ReactNode;
  initialSite: SiteContent;
};

export function AppProviders({ children, initialSite }: AppProvidersProps) {
  return (
    <AdminViewProvider initialSite={initialSite}>
      <AdminModeBanner />
      {children}
      <AdminModePanel />
      <AdminModeGate />
    </AdminViewProvider>
  );
}
