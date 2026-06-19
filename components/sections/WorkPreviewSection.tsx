import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { SectionReveal } from "@/components/ui/motion";
import { PhoneMarquee } from "@/components/phone/PhoneMarquee";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { sectionWallpapers } from "@/lib/plants";
import { sectionText } from "@/lib/sectionText";
import { filterVideos } from "@/lib/videos/filter";
import { uniqueVideosById } from "@/lib/videos/sort";
import type { PortfolioVideo } from "@/lib/videos/types";
import { getSiteContent } from "@/lib/site";

type WorkPreviewSectionProps = {
  videos: PortfolioVideo[];
};

export async function WorkPreviewSection({ videos }: WorkPreviewSectionProps) {
  const site = await getSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.work;
  const text = sectionText.work;
  const featured = filterVideos(videos, { featured: true });
  const marqueeVideos = uniqueVideosById(
    featured.length > 0 ? featured : videos,
  );

  return (
    <section
      id="work"
      className="scroll-section-anchor relative overflow-hidden py-20"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <SectionReveal className="text-center">
          <h2 className={`font-display text-3xl sm:text-4xl ${text.heading}`}>
            Selected Work
          </h2>
          <p className={`mx-auto mt-4 max-w-2xl ${text.body}`}>
            Tap a phone to play — {site.name}&apos;s UGC, framed like scroll
            stopped mid-story.
          </p>
        </SectionReveal>
      </div>

      <div className="relative z-10 mt-10">
        <PhoneMarquee videos={marqueeVideos} emptyClassName={text.empty} />
      </div>

      <div className="relative z-10 mt-10 flex justify-center">
        <AnimatedButton href="/work" variant="soft">
          See All of {site.name}&apos;s Work
        </AnimatedButton>
      </div>
    </section>
  );
}
