"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { DecorMotifs } from "@/components/ui/DecorMotifs";
import { PhoneMarquee } from "@/components/phone/PhoneMarquee";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { SectionReveal } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionText } from "@/lib/sectionText";
import { uniqueVideosById } from "@/lib/videos/sort";
import type { PortfolioVideo } from "@/lib/videos/types";

type WorkCarouselProps = {
  featuredVideos: PortfolioVideo[];
};

/** Forest title band plus the featured phone carousel below. */
export function WorkCarousel({ featuredVideos }: WorkCarouselProps) {
  const site = useSiteContent();
  const visibleVideos = uniqueVideosById(featuredVideos);

  return (
    <>
      <div className="band-forest relative overflow-hidden px-4 pt-12 pb-16 sm:px-6 sm:pt-14 sm:pb-20">
        <DecorMotifs preset="edges" tone="paper" />
        <SectionButterfly flight="workBand" />
        <AdminEditButton target="portfolio" label="Edit videos" tone="light" />
        <SectionReveal className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="font-script text-4xl leading-tight text-paper sm:text-6xl">
            {site.work.heading}
          </h2>
        </SectionReveal>
      </div>

      <div className="relative overflow-hidden pt-10 pb-16 sm:pt-12 sm:pb-20">
        <SectionSurface tone="sage" motifs="scatter" />
        <SectionButterfly flight="workMarquee" />
        <div className="relative z-10">
          <PhoneMarquee
            videos={visibleVideos}
            emptyClassName={sectionText.work.empty}
            captionClasses={sectionText.work.caption}
          />
        </div>

        <SectionReveal
          delay={0.15}
          className="relative z-10 mt-10 flex justify-center"
        >
          <AnimatedButton href="/work" variant="primary">
            See All of {site.name}&apos;s Work
          </AnimatedButton>
        </SectionReveal>
      </div>
    </>
  );
}
