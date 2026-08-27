"use client";

import Image from "next/image";
import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { DeferredMount } from "@/components/ui/DeferredMount";
import { DecorMotifs } from "@/components/ui/DecorMotifs";
import { SectionSurface } from "@/components/ui/SectionSurface";
import {
  SectionReveal,
  StaggerChildren,
  StaggerItem,
  type RevealVariant,
} from "@/components/ui/motion";
import { isRemoteMediaUrl } from "@/lib/media/urls";
import type { CollagePhotoShape } from "@/lib/site/types";

const COLLAGE_REVEALS: RevealVariant[] = ["fadeUp", "fadeLeft", "fadeRight"];

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
      className="photography-about-band scroll-section-anchor relative overflow-hidden px-4 pt-8 pb-16 sm:px-6 sm:pt-10 sm:pb-20"
    >
      <DecorMotifs preset="right" />
      <AdminEditButton section="photography" label="Edit photos" />
      <SectionButterfly flight="photography" />
      <SectionButterfly flight="photographyLow" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <SectionReveal variant="fadeUp" className="mx-auto mb-8 w-fit max-w-full sm:mb-10">
          <div className="relative overflow-hidden rounded-[2rem] px-7 py-3.5 text-center shadow-[0_12px_32px_rgba(35,57,42,0.18)] sm:px-10 sm:py-4">
            <SectionSurface tone="forest" motifs="none" />
            <h2
              id="photography-heading"
              className="relative z-10 font-script pb-1 text-3xl leading-[1.15] text-balance text-paper sm:text-5xl"
            >
              {site.photography.label}
            </h2>
          </div>
        </SectionReveal>

        {/* Dense flow backfills the holes that tall/wide tiles leave behind. */}
        <DeferredMount className="min-h-[28rem] sm:min-h-[36rem]">
          <StaggerChildren className="grid auto-rows-[minmax(0,7rem)] grid-flow-row-dense grid-cols-3 gap-2 sm:auto-rows-[minmax(0,9rem)] sm:grid-cols-4 sm:gap-3">
          {photos.map((photo, index) => {
            const tile = (
              <>
                {photo.imagePath ? (
                  <Image
                    src={photo.imagePath}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 33vw, 25vw"
                    decoding="async"
                    unoptimized={isRemoteMediaUrl(photo.imagePath)}
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
                variant={COLLAGE_REVEALS[index % COLLAGE_REVEALS.length] ?? "fadeUp"}
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
        </DeferredMount>
      </div>
    </section>
  );
}
