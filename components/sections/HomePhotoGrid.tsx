"use client";

import Image from "next/image";
import { useAdminView } from "@/components/admin/AdminViewProvider";

export function HomePhotoGrid() {
  const { site, viewMode, openSiteEditor } = useAdminView();
  const isAdminView = viewMode === "admin";
  const photos =
    isAdminView
      ? site.homePhotoGrid.photos
      : site.homePhotoGrid.photos.filter((photo) => photo.imagePath);

  if (photos.length === 0) return null;

  return (
    <div className="relative z-10 mx-auto mt-10 max-w-5xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {photos.map((photo) => {
          const tileContent = (
            <>
              {photo.imagePath ? (
                <Image
                  src={photo.imagePath}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-paper/38 via-lavender/18 to-pink/20 p-4 text-center">
                  <p className="font-label text-[10px] font-semibold tracking-[0.16em] text-paper/85 uppercase drop-shadow-[0_1px_8px_rgba(74,69,104,0.5)]">
                    Upload photo
                  </p>
                </div>
              )}
              {isAdminView && (
                <span className="absolute inset-x-3 bottom-3 rounded-full border border-white/45 bg-paper/72 px-3 py-1 text-center font-label text-[10px] font-semibold tracking-[0.14em] text-burgundy uppercase opacity-0 shadow-sm backdrop-blur-md transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  Edit grid
                </span>
              )}
            </>
          );

          if (isAdminView) {
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => openSiteEditor("homeGrid")}
                aria-label={`Edit ${photo.alt}`}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-white/45 bg-paper/24 text-left shadow-lg shadow-indigo/10 ring-1 ring-white/25 backdrop-blur-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pink/55 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo/20"
              >
                {tileContent}
              </button>
            );
          }

          return (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-2xl border border-white/45 bg-paper/24 shadow-lg shadow-indigo/10 ring-1 ring-white/25 backdrop-blur-sm"
            >
              {tileContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
