import { WorkCarousel } from "@/components/sections/WorkCarousel";
import { filterVideos } from "@/lib/videos/filter";
import type { PortfolioVideo } from "@/lib/videos/types";

type WorkPreviewSectionProps = {
  videos: PortfolioVideo[];
};

export function WorkPreviewSection({ videos }: WorkPreviewSectionProps) {
  if (videos.length === 0) return null;

  const featured = filterVideos(videos, { featured: true });

  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="scroll-section-anchor relative"
    >
      <WorkCarousel
        featuredVideos={featured.length > 0 ? featured : videos}
      />
    </section>
  );
}
