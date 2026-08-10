import type { ReactNode } from "react";
import { DecorMotifs, type MotifPreset } from "@/components/ui/DecorMotifs";

type BannerTone = "forest" | "brown";

type ScallopedBannerProps = {
  children: ReactNode;
  className?: string;
  /** Extra classes for the inner content wrapper. */
  contentClassName?: string;
  tone?: BannerTone;
  /** Scalloped bottom edge. Off gives a clean full-bleed band. */
  scalloped?: boolean;
  motifs?: MotifPreset;
};

const TONE_SURFACE: Record<BannerTone, string> = {
  forest: "band-forest",
  brown: "bg-brown",
};

/**
 * Full-bleed accent strip, optionally with a repeating scalloped bottom edge.
 * Place between lighter sections so the band reads as punctuation.
 *
 * Motifs/butterflies clip inside the band body; the scallop surface sits outside
 * that clip so parent overflow never eats the edge.
 */
export function ScallopedBanner({
  children,
  className = "",
  contentClassName = "",
  tone = "forest",
  scalloped = true,
  motifs = "corners",
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
      {/* Clip decor to the band body without clipping the hanging scallops. */}
      <div className="relative overflow-hidden">
        <DecorMotifs preset={motifs} tone="paper" />
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
