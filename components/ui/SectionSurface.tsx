import { DecorMotifs, type MotifPreset } from "@/components/ui/DecorMotifs";

export type SurfaceTone =
  | "ivory"
  | "sage"
  | "blush"
  | "lavender"
  | "brown"
  | "forest";

type SectionSurfaceProps = {
  tone: SurfaceTone;
  motifs?: MotifPreset;
  className?: string;
};

/**
 * Gradient wash that sits behind a section, replacing the old photographic
 * wallpapers. The parent section must be `relative overflow-hidden`, and its
 * content should sit in a `relative z-10` wrapper.
 */
export function SectionSurface({
  tone,
  motifs = "edges",
  className = "",
}: SectionSurfaceProps) {
  return (
    <div aria-hidden className={`absolute inset-0 section-wash-${tone} ${className}`}>
      <DecorMotifs preset={motifs} tone={tone === "forest" ? "paper" : "ink"} />
    </div>
  );
}
