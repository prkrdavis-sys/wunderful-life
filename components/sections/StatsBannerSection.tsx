"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { ScallopedBanner } from "@/components/ui/ScallopedBanner";
import { StaggerChildren, StaggerItem } from "@/components/ui/motion";

/** Reach and engagement figures, shown as a band directly under the hero. */
export function StatsBannerSection() {
  const { site, viewMode } = useAdminView();
  const isAdminView = viewMode === "admin";
  const { visible, items } = site.statsBanner;

  if (!isAdminView && (!visible || items.length === 0)) return null;

  return (
    <section aria-label="Audience stats" className="relative">
      <ScallopedBanner className="pb-4 sm:pb-6">
        <AdminEditButton section="stats" label="Edit stats" tone="light" />
        {items.length === 0 ? (
          <p className="text-center font-label text-sm text-paper/70">
            No stats yet — add some in the site editor.
          </p>
        ) : (
          <StaggerChildren className="grid grid-cols-2 gap-x-4 gap-y-7 sm:flex sm:items-start sm:justify-around sm:gap-8">
            {items.map((stat) => (
              <StaggerItem key={stat.id} className="text-center">
                <p className="font-script pb-1 text-4xl leading-[1.15] text-paper sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 font-label text-[11px] font-bold tracking-[0.08em] text-paper/90 sm:text-sm">
                  {stat.label}
                </p>
              </StaggerItem>
            ))}
          </StaggerChildren>
        )}
      </ScallopedBanner>
      {isAdminView && !visible && (
        <p className="bg-honey/30 py-2 text-center font-label text-xs tracking-[0.14em] text-brown uppercase">
          Stats banner hidden from visitors
        </p>
      )}
    </section>
  );
}
