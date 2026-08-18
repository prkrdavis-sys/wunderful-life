import type { ReactNode } from "react";

type BannerTone = "forest" | "brown";

type ScallopedBannerProps = {
  children: ReactNode;
  className?: string;
  /** Extra classes for the inner content wrapper. */
  contentClassName?: string;
  tone?: BannerTone;
  /** Scalloped bottom edge. Off gives a clean full-bleed band. */
  scalloped?: boolean;
};

const TONE_SURFACE: Record<BannerTone, string> = {
  forest: "band-forest",
  brown: "bg-brown",
};

/**
 * Full-bleed accent strip, optionally with a repeating scalloped bottom edge.
 * Place between lighter sections so the band reads as punctuation.
 *
 * The scallop surface sits outside the content clip so parent overflow never
 * eats the edge. Banners stay unornamented — flowers, moons, and butterflies
 * belong on the neighboring section washes instead.
 */
export function ScallopedBanner({
  children,
  className = "",
  contentClassName = "",
  tone = "forest",
  scalloped = true,
}: ScallopedBannerProps) {
  return (
    <div
      className={`relative z-10 ${scalloped ? "" : TONE_SURFACE[tone]} text-paper ${className}`}
    >
      {scalloped && (
        <div
          className={`scalloped-banner-surface ${TONE_SURFACE[tone]}`}
          aria-hidden
        />
      )}
      <div className="relative overflow-hidden">
        <div
          className={`relative mx-auto max-w-6xl px-4 sm:px-6 ${
            contentClassName || "py-8 sm:py-10"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
