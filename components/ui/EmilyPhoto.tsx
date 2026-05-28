import type { SiteContent } from "@/lib/site";

const accentGradients: Record<string, string> = {
  green: "from-green/50 via-green/20 to-cream",
  pink: "from-pink/50 via-pink/20 to-cream",
  blue: "from-blue/40 via-blue/15 to-cream",
  yellow: "from-yellow/60 via-yellow/25 to-cream",
  brown: "from-brown-light/40 via-brown/10 to-cream",
};

type EmilyPhotoProps = {
  photo: SiteContent["about"]["photos"][number];
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "max-w-[140px]",
  md: "max-w-[200px]",
  lg: "max-w-[280px]",
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
        className={`aspect-[4/5] overflow-hidden rounded-sm bg-gradient-to-br ${gradient}`}
      >
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <span className="font-display text-4xl text-brown/25 sm:text-5xl">
            E
          </span>
          <p className="text-[10px] leading-snug text-brown/50 sm:text-xs">
            Photo placeholder
          </p>
        </div>
      </div>
      <figcaption className="mt-2 text-center font-display text-xs text-brown sm:text-sm">
        {photo.caption}
      </figcaption>
    </figure>
  );
}
