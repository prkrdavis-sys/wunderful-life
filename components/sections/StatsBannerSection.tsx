"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { StaggerChildren, StaggerItem } from "@/components/ui/motion";

/** Reach and engagement figures, shown as a full section after photography. */
export function StatsBannerSection() {
  const { site, viewMode } = useAdminView();
  const isAdminView = viewMode === "admin";
  const { visible, items } = site.statsBanner;

  if (!isAdminView && (!visible || items.length === 0)) return null;

  return (
    <section
      aria-label="Audience stats"
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20"
    >
      <SectionSurface tone="forest" motifs="edges" />
      <AdminEditButton section="stats" label="Edit stats" tone="light" />

      <div className="relative z-10 mx-auto max-w-5xl">
        {items.length === 0 ? (
          <p className="text-center font-label text-sm text-paper/70">
            No stats yet — add some in the site editor.
          </p>
        ) : (
          <StaggerChildren className="grid grid-cols-2 gap-x-4 gap-y-10 sm:flex sm:items-start sm:justify-around sm:gap-8">
            {items.map((stat) => (
              <StaggerItem key={stat.id} className="text-center">
                <p className="font-script pb-1 text-4xl leading-[1.15] text-paper sm:text-5xl">
                  {stat.value}
                </p>
                <span
                  aria-hidden
                  className="mx-auto mt-3 block h-px w-8 bg-honey/75"
                />
                <p className="mt-3 font-label text-[11px] font-bold tracking-[0.08em] text-paper/90 sm:text-sm">
                  {stat.label}
                </p>
              </StaggerItem>
            ))}
          </StaggerChildren>
        )}

        {isAdminView && !visible && (
          <p className="mt-8 text-center font-label text-xs tracking-[0.14em] text-honey uppercase">
            Stats section hidden from visitors
          </p>
        )}
      </div>
    </section>
  );
}
