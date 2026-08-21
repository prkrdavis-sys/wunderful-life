"use client";

import { AutoplayLoopVideo } from "@/components/ui/AutoplayLoopVideo";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { HeroEntrance } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";
import { lightOnDarkShadow, sectionText } from "@/lib/sectionText";

function HeroBackgroundVideo({
  src,
  poster,
}: {
  src: string;
  poster?: string;
}) {
  return (
    <>
      <AutoplayLoopVideo
        src={src}
        poster={poster}
        muted
        eager
        aria-hidden
        tabIndex={-1}
        className="pointer-events-none object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/55"
      />
    </>
  );
}

export function HeroSection() {
  const site = useSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.hero;
  const text = sectionText.hero;
  const videoPath = site.hero.videoPath;
  const hasVideo = Boolean(videoPath);

  return (
    <section className="relative flex min-h-[85svh] flex-col overflow-hidden px-4 py-16 sm:px-6 sm:py-20">
      <PlantSectionBackground
        wallpaper={wallpaper}
        overlay={hasVideo ? "none" : overlay}
        priority={!hasVideo}
      />
      {hasVideo && videoPath ? (
        <HeroBackgroundVideo src={videoPath} poster={site.hero.posterPath} />
      ) : null}

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center text-center">
        <div className="flex flex-1 flex-col items-center justify-center">
          <HeroEntrance variant="fadeDown" delay={0.05}>
            <p
              className={`mb-3 text-sm font-medium tracking-[0.28em] uppercase ${
                hasVideo ? `text-paper/85 ${lightOnDarkShadow}` : text.eyebrow
              }`}
            >
              {site.brand}
            </p>
          </HeroEntrance>
          <HeroEntrance delay={0.14}>
            <h1
              className={`font-display text-5xl leading-[1.05] sm:text-6xl md:text-7xl lg:text-8xl ${
                hasVideo ? `text-paper ${lightOnDarkShadow}` : text.heading
              }`}
            >
              {site.fullName}
            </h1>
          </HeroEntrance>
        </div>

        <HeroEntrance delay={0.24}>
          <p
            className={`font-script mx-auto max-w-2xl pb-2 text-3xl leading-snug sm:text-4xl ${
              hasVideo ? `text-paper ${lightOnDarkShadow}` : text.caption
            }`}
          >
            {site.hero.subtitle}
          </p>
        </HeroEntrance>
      </div>
    </section>
  );
}
