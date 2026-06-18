import Image from "next/image";
import type { AboutPhoto } from "@/lib/site/types";
import { photoAccentGradient } from "@/lib/site/accents";

type EmilyPhotoProps = {
  photo: AboutPhoto;
  size?: "sm" | "md" | "lg" | "xl" | "hero" | "gallery";
  className?: string;
};

const sizeClasses = {
  sm: "w-full max-w-[160px]",
  md: "w-full max-w-[220px] sm:max-w-[250px]",
  lg: "w-full max-w-[280px] sm:max-w-[340px] xl:max-w-[400px]",
  xl: "w-full max-w-[320px] sm:max-w-[420px] xl:max-w-[480px]",
  hero: "w-full max-w-full sm:max-w-[min(100%,480px)] xl:max-w-[min(100%,560px)]",
  gallery: "w-full max-w-md mx-auto sm:max-w-none",
};

const frameClasses = {
  sm: "p-2",
  md: "p-2",
  lg: "p-2.5",
  xl: "p-3",
  hero: "p-3 sm:p-4",
  gallery: "p-2.5 sm:p-3",
};

const imageSizes: Record<NonNullable<EmilyPhotoProps["size"]>, string> = {
  sm: "160px",
  md: "250px",
  lg: "340px",
  xl: "480px",
  hero: "(max-width: 640px) 360px, (max-width: 1024px) 480px, 640px",
  gallery: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
};

export function EmilyPhoto({
  photo,
  size = "md",
  className = "",
}: EmilyPhotoProps) {
  const gradient = photoAccentGradient(photo.accent);

  return (
    <figure
      className={`max-w-full ${sizeClasses[size]} ${frameClasses[size]} rotate-[var(--photo-rotate)] rounded-sm border border-white/90 bg-paper shadow-lg shadow-indigo/10 ring-1 ring-lavender/20 ${className}`}
      style={{ ["--photo-rotate" as string]: `${photo.rotate}deg` }}
    >
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-sm bg-gradient-to-br ${gradient}`}
      >
        {photo.imagePath ? (
          <Image
            src={photo.imagePath}
            alt={photo.caption}
            fill
            sizes={imageSizes[size]}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <span className="font-display text-4xl text-brown/25 sm:text-5xl">
              E
            </span>
            <p className="text-[10px] leading-snug text-brown/50 sm:text-xs">
              Photo placeholder
            </p>
          </div>
        )}
      </div>
      <figcaption className="font-label mt-3 text-center text-xs tracking-wide text-indigo/90 sm:text-sm">
        {photo.caption}
      </figcaption>
    </figure>
  );
}
