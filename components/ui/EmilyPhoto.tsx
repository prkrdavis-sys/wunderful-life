import Image from "next/image";
import type { AboutPhoto } from "@/lib/site/types";

const accentGradients: Record<string, string> = {
  green: "from-green/50 via-green/20 to-cream",
  pink: "from-pink/50 via-pink/20 to-cream",
  blue: "from-blue/40 via-blue/15 to-cream",
  yellow: "from-yellow/60 via-yellow/25 to-cream",
  brown: "from-brown-light/40 via-brown/10 to-cream",
};

type EmilyPhotoProps = {
  photo: AboutPhoto;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses = {
  sm: "w-[160px]",
  md: "w-[220px] sm:w-[250px]",
  lg: "w-[260px] sm:w-[300px] lg:w-[340px]",
  xl: "w-[280px] sm:w-[340px] lg:w-[400px]",
};

export function EmilyPhoto({ photo, size = "md" }: EmilyPhotoProps) {
  const gradient =
    accentGradients[photo.accent] ?? accentGradients.green;

  return (
    <figure
      className={`${sizeClasses[size]} rotate-[var(--photo-rotate)] rounded-sm border border-white/90 bg-paper p-2 shadow-lg shadow-indigo/5 ring-1 ring-lavender/20`}
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
            sizes="(max-width: 640px) 280px, (max-width: 1024px) 340px, 400px"
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
      <figcaption className="font-label mt-2 text-center text-xs tracking-wide text-brown sm:text-sm">
        {photo.caption}
      </figcaption>
    </figure>
  );
}
