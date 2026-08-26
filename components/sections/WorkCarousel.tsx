"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { DeferredMount } from "@/components/ui/DeferredMount";
import { AccentSection } from "@/components/ui/AccentSection";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
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

/** Forest title section plus the featured phone carousel below. */
export function WorkCarousel({ featuredVideos }: WorkCarouselProps) {
  const site = useSiteContent();
  const visibleVideos = uniqueVideosById(featuredVideos);

  if (visibleVideos.length === 0) return null;

  return (
    <>
      <AccentSection>
        <AdminEditButton target="portfolio" label="Edit videos" tone="light" />
        <SectionReveal className="relative z-10 mx-auto max-w-4xl">
          <h2 className="font-script text-4xl leading-tight text-balance text-paper sm:text-6xl">
            {site.work.heading}
          </h2>
        </SectionReveal>
      </AccentSection>

      <div className="relative min-h-[28rem] overflow-hidden pt-10 pb-16 sm:min-h-[32rem] sm:pt-12 sm:pb-20">
        <SectionSurface tone="sage" motifs="scatter" />
        <SectionButterfly flight="workBand" />
        <SectionButterfly flight="workMarquee" />
        <div className="relative z-10">
          <DeferredMount className="min-h-[24rem] sm:min-h-[28rem]">
            <PhoneMarquee
              videos={visibleVideos}
              emptyClassName={sectionText.work.empty}
              captionClasses={sectionText.work.caption}
            />
          </DeferredMount>
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
