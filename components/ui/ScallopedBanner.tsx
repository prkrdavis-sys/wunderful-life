import type { CSSProperties, ReactNode } from "react";
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

const TONE_SCALLOP: Record<BannerTone, string> = {
  forest: "var(--forest-deep)",
  brown: "var(--brown)",
};

/**
 * Full-bleed accent strip, optionally with a repeating scalloped bottom edge.
 * Place between lighter sections so the band reads as punctuation.
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
    <div className={`relative z-10 ${TONE_SURFACE[tone]} text-paper ${className}`}>
      <DecorMotifs preset={motifs} tone="paper" />
      <div
        className={`relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 ${contentClassName}`}
      >
        {children}
      </div>
      {scalloped && (
        <div
          className="scalloped-banner-edge"
          style={{ "--scallop-color": TONE_SCALLOP[tone] } as CSSProperties}
          aria-hidden
        />
      )}
    </div>
  );
}
