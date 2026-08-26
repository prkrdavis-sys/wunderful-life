"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { DeferredMount } from "@/components/ui/DeferredMount";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { PhoneMarquee } from "@/components/phone/PhoneMarquee";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { SectionReveal } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionText } from "@/lib/sectionText";
import { uniqueVideosById } from "@/lib/videos/sort";
import type { PortfolioVideo } from "@/lib/videos/types";

type WorkCarouselProps = {
  featuredVideos: PortfolioVideo[];
};

/** Featured phone carousel with the section title sitting on the same wash. */
export function WorkCarousel({ featuredVideos }: WorkCarouselProps) {
  const site = useSiteContent();
  const visibleVideos = uniqueVideosById(featuredVideos);

  if (visibleVideos.length === 0) return null;

  return (
    <div className="relative min-h-[28rem] overflow-hidden pt-16 pb-16 sm:min-h-[32rem] sm:pt-20 sm:pb-20">
      <SectionSurface tone="sage" motifs="scatter" />
      <SectionButterfly flight="workBand" />
      <SectionButterfly flight="workMarquee" />
      <AdminEditButton target="portfolio" label="Edit videos" />

      <div className="relative z-10">
        <SectionHeading className="px-4 sm:px-6">
          {site.work.heading}
        </SectionHeading>

        <DeferredMount className="mt-8 min-h-[24rem] sm:mt-10 sm:min-h-[28rem]">
          <PhoneMarquee
            videos={visibleVideos}
            emptyClassName={sectionText.work.empty}
            captionClasses={sectionText.work.caption}
          />
        </DeferredMount>

        <SectionReveal
          delay={0.15}
          className="mt-10 flex justify-center"
        >
          <AnimatedButton href="/work" variant="primary">
            See All of {site.name}&apos;s Work
          </AnimatedButton>
        </SectionReveal>
      </div>
    </div>
  );
}
