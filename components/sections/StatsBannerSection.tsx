"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { EmilyPhoto } from "@/components/ui/EmilyPhoto";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { SectionReveal, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { resolveAboutPhotoFrame } from "@/lib/site/types";

/** Reach and engagement figures, shown as a forest panel in the About Me band. */
export function StatsBannerSection() {
  const { site, viewMode } = useAdminView();
  const isAdminView = viewMode === "admin";
  const { visible, items } = site.statsBanner;
  const showPhotos = site.statsBanner.showPhotos !== false;
  const photos = site.statsBanner.photos ?? [];
  const publicPhotos = photos.filter((photo) => photo.imagePath);
  const displayPhotos = isAdminView ? photos : publicPhotos;
  const previewPhotos = isAdminView || showPhotos;
  const hasPhotos = previewPhotos && displayPhotos.length > 0;
  const hasPublicContent = items.length > 0 || (showPhotos && publicPhotos.length > 0);

  if (!isAdminView && (!visible || !hasPublicContent)) return null;

  return (
    <section
      aria-label="Audience stats"
      className="relative px-4 py-8 sm:px-6 sm:py-10"
    >
      <SectionReveal
        variant="fadeUp"
        className={`relative mx-auto w-full overflow-hidden rounded-[2rem] px-6 text-center shadow-[0_12px_32px_rgba(35,57,42,0.18)] sm:px-10 ${
          hasPhotos
            ? "max-w-5xl py-10 sm:py-12"
            : "max-w-3xl py-8 sm:py-9"
        }`}
      >
        <SectionSurface tone="forest" motifs="none" />
        <AdminEditButton section="stats" label="Edit stats" tone="light" />
        <div className="relative z-10">
          {items.length === 0 ? (
            isAdminView ? (
              <p className="font-label text-sm text-paper/70">
                No stats yet. Add some in the site editor.
              </p>
            ) : null
          ) : (
            <StaggerChildren className="grid grid-cols-2 gap-x-4 gap-y-7 sm:flex sm:items-start sm:justify-around sm:gap-8">
              {items.map((stat) => (
                <StaggerItem key={stat.id} variant="fadeUp" className="text-center">
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

          {hasPhotos ? (
            <StaggerChildren className="mt-8 flex flex-wrap items-start justify-center gap-x-5 gap-y-6 sm:mt-10 sm:gap-x-8 sm:gap-y-8">
              {displayPhotos.map((photo) => {
                const frame = resolveAboutPhotoFrame(photo.frame);
                return (
                  <StaggerItem key={photo.id} variant="fadeUp">
                    <EmilyPhoto
                      photo={photo}
                      size="panel"
                      className="mx-auto"
                      captionClassName={
                        frame === "polaroid" ? undefined : "text-paper/90"
                      }
                    />
                  </StaggerItem>
                );
              })}
            </StaggerChildren>
          ) : null}
        </div>
      </SectionReveal>
      {isAdminView && !visible && (
        <p className="mx-auto mt-3 max-w-3xl text-center font-label text-xs tracking-[0.14em] text-brown uppercase">
          Stats section hidden from visitors
        </p>
      )}
      {isAdminView && visible && !showPhotos && photos.length > 0 && (
        <p className="mx-auto mt-3 max-w-3xl text-center font-label text-xs tracking-[0.14em] text-brown uppercase">
          Photos hidden from visitors
        </p>
      )}
    </section>
  );
}
