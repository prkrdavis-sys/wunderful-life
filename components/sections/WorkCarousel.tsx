"use client";

import { Fragment, useMemo, useState } from "react";
import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { DecorMotifs } from "@/components/ui/DecorMotifs";
import { PhoneMarquee } from "@/components/phone/PhoneMarquee";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { SectionReveal } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionText } from "@/lib/sectionText";
import { uniqueVideosById } from "@/lib/videos/sort";
import type { PortfolioVideo } from "@/lib/videos/types";

type WorkCarouselProps = {
  /** Every video, searched when a category filter is applied. */
  videos: PortfolioVideo[];
  /** Featured subset shown when no filter is active. */
  featuredVideos: PortfolioVideo[];
};

const ALL = "all";

/**
 * The forest title band with its filter chips plus the phone carousel below.
 * Both live here so the chips can drive the carousel from inside the band.
 */
export function WorkCarousel({ videos, featuredVideos }: WorkCarouselProps) {
  const site = useSiteContent();
  const [active, setActive] = useState<string>(ALL);

  const chips = useMemo(
    () => site.work.categories.slice(0, site.work.categoriesShown),
    [site.work.categories, site.work.categoriesShown],
  );

  const visibleVideos = useMemo(() => {
    if (active === ALL) return uniqueVideosById(featuredVideos);
    return uniqueVideosById(videos.filter((video) => video.tags.includes(active)));
  }, [active, featuredVideos, videos]);

  const activeLabel = chips.find((chip) => chip.id === active)?.label;

  return (
    <>
      <div className="band-forest relative overflow-hidden px-4 pt-12 pb-16 sm:px-6 sm:pt-14 sm:pb-20">
        <DecorMotifs preset="edges" tone="paper" />
        <AdminEditButton target="portfolio" label="Edit videos" tone="light" />
        <SectionReveal className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="font-script text-4xl leading-tight text-paper sm:text-6xl">
            {site.work.heading}
          </h2>

          {chips.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 sm:mt-8 sm:gap-x-2">
              <CategoryChip
                label="All"
                active={active === ALL}
                onSelect={() => setActive(ALL)}
              />
              {chips.map((chip) => (
                <Fragment key={chip.id}>
                  <span aria-hidden className="text-paper/40">
                    •
                  </span>
                  <CategoryChip
                    label={chip.label}
                    active={active === chip.id}
                    onSelect={() => setActive(chip.id)}
                  />
                </Fragment>
              ))}
            </div>
          )}
        </SectionReveal>
      </div>

      <div className="relative overflow-hidden pt-10 pb-16 sm:pt-12 sm:pb-20">
        <SectionSurface tone="sage" motifs="scatter" />
        <div className="relative z-10">
          {visibleVideos.length === 0 && activeLabel ? (
            <p className={`px-6 text-center ${sectionText.work.empty}`}>
              No {activeLabel.toLowerCase()} videos yet — tag a video with this
              category in the video admin.
            </p>
          ) : (
            <PhoneMarquee
              key={active}
              videos={visibleVideos}
              emptyClassName={sectionText.work.empty}
              captionClasses={sectionText.work.caption}
            />
          )}
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

function CategoryChip({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 font-label text-sm font-semibold tracking-[0.06em] transition sm:text-base ${
        active
          ? "bg-paper/18 text-paper"
          : "text-paper/65 hover:bg-paper/10 hover:text-paper"
      }`}
    >
      {label}
    </button>
  );
}
