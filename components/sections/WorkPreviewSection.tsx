import { WorkCarousel } from "@/components/sections/WorkCarousel";
import { filterVideos } from "@/lib/videos/filter";
import type { PortfolioVideo } from "@/lib/videos/types";

type WorkPreviewSectionProps = {
  videos: PortfolioVideo[];
};

export function WorkPreviewSection({ videos }: WorkPreviewSectionProps) {
  const featured = filterVideos(videos, { featured: true });

  return (
    <section id="work" className="scroll-section-anchor relative">
      <WorkCarousel
        videos={videos}
        featuredVideos={featured.length > 0 ? featured : videos}
      />
    </section>
  );
}
