import type { ReactNode } from "react";
import { SectionSurface } from "@/components/ui/SectionSurface";

type AccentSectionProps = {
  children: ReactNode;
  className?: string;
  /** Extra classes for the inner content wrapper. */
  contentClassName?: string;
};

/**
 * Forest title/stats section that replaced the scalloped banners.
 * Same cream-on-forest content, straight edges, no hanging scallops.
 */
export function AccentSection({
  children,
  className = "",
  contentClassName = "",
}: AccentSectionProps) {
  return (
    <div className={`relative overflow-hidden text-paper ${className}`}>
      <SectionSurface tone="forest" motifs="none" />
      <div
        className={`relative z-10 mx-auto max-w-6xl px-4 sm:px-6 ${
          contentClassName || "py-14 text-center sm:py-16"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
