import type { ReactNode } from "react";

type ScallopedBannerProps = {
  children: ReactNode;
  className?: string;
  /** Extra classes for the inner content wrapper. */
  contentClassName?: string;
};

/**
 * Full-bleed burgundy strip with a repeating scalloped bottom edge.
 * Place over a lighter or photographic section so the scallops read clearly.
 */
export function ScallopedBanner({
  children,
  className = "",
  contentClassName = "",
}: ScallopedBannerProps) {
  return (
    <div className={`relative z-10 bg-burgundy text-paper ${className}`}>
      <div
        className={`mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 ${contentClassName}`}
      >
        {children}
      </div>
      <div className="scalloped-banner-edge" aria-hidden />
    </div>
  );
}
