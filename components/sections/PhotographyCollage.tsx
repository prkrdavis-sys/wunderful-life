"use client";

import Image from "next/image";
import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { ScallopedBanner } from "@/components/ui/ScallopedBanner";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { StaggerChildren, StaggerItem } from "@/components/ui/motion";
import type { CollagePhotoShape } from "@/lib/site/types";

/** Row/column spans that give the collage its irregular, scrapbook rhythm. */
const SHAPE_SPAN: Record<CollagePhotoShape, string> = {
  square: "col-span-1 row-span-1",
  tall: "col-span-1 row-span-2",
  wide: "col-span-2 row-span-1",
};

export function PhotographyCollage() {
  const { site, viewMode, openSiteEditor } = useAdminView();
  const isAdminView = viewMode === "admin";
  const photos = site.photography.photos;

  if (photos.length === 0) return null;

  return (
    <section
      id="photography"
      aria-labelledby="photography-heading"
      className="scroll-section-anchor relative"
    >
      <ScallopedBanner className="pb-4 sm:pb-6">
        <AdminEditButton section="photography" label="Edit photos" tone="light" />
        <div className="flex justify-center">
          <p
            id="photography-heading"
            className="frosted-panel rounded-2xl border border-white/60 px-8 py-3 font-script text-3xl text-forest sm:px-12 sm:py-4 sm:text-5xl"
          >
            {site.photography.label}
          </p>
        </div>
      </ScallopedBanner>

      <div className="relative overflow-hidden px-4 pt-20 pb-16 sm:px-6 sm:pt-24 sm:pb-20">
        <SectionSurface tone="blush" motifs="right" />
        <SectionButterfly flight="photography" />
        <SectionButterfly flight="photographyLow" />

        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Dense flow backfills the holes that tall/wide tiles leave behind. */}
          <StaggerChildren className="grid auto-rows-[minmax(0,7rem)] grid-flow-row-dense grid-cols-3 gap-2 sm:auto-rows-[minmax(0,9rem)] sm:grid-cols-4 sm:gap-3">
            {photos.map((photo) => {
              const tile = (
                <>
                  {photo.imagePath ? (
                    <Image
                      src={photo.imagePath}
                      alt={photo.alt}
                      fill
                      sizes="(max-width: 640px) 33vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    // Empty tiles stay as soft washes so visitors see a
                    // complete collage rather than "missing photo" chrome.
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-paper/80 via-blush/25 to-lavender/25 p-3 text-center">
                      {isAdminView && (
                        <p className="font-label text-[10px] font-semibold tracking-[0.14em] text-brown/70 uppercase">
                          Upload photo
                        </p>
                      )}
                    </div>
                  )}
                </>
              );

              return (
                <StaggerItem
                  key={photo.id}
                  className={`${SHAPE_SPAN[photo.shape]} min-h-0`}
                >
                  {isAdminView ? (
                    <button
                      type="button"
                      onClick={() =>
                        openSiteEditor("photography", {
                          kind: "photography-photo",
                          photoId: photo.id,
                        })
                      }
                      aria-label={`Edit ${photo.alt}`}
                      className="group relative h-full w-full overflow-hidden rounded-2xl border border-white/60 bg-paper/40 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
                    >
                      {tile}
                      <span className="absolute inset-x-2 bottom-2 rounded-full border border-white/50 bg-paper/80 px-2 py-1 text-center font-label text-[10px] font-semibold tracking-[0.12em] text-forest uppercase opacity-0 backdrop-blur-md transition group-hover:opacity-100 group-focus-visible:opacity-100">
                        Edit
                      </span>
                    </button>
                  ) : (
                    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/60 bg-paper/40 shadow-sm">
                      {tile}
                    </div>
                  )}
                </StaggerItem>
              );
            })}
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
}
