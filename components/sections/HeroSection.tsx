"use client";

import { useCallback, useEffect, useState } from "react";
import { AutoplayLoopVideo } from "@/components/ui/AutoplayLoopVideo";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { HeroEntrance } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";
import { lightOnDarkShadow, sectionText } from "@/lib/sectionText";
import type { MediaIntrinsicSize, VideoObjectFit } from "@/lib/videos/cover-fit";

function HeroBackgroundVideo({
  src,
  poster,
  fit,
  onIntrinsicSize,
}: {
  src: string;
  poster?: string;
  fit: VideoObjectFit;
  onIntrinsicSize: (size: MediaIntrinsicSize) => void;
}) {
  return (
    <>
      <AutoplayLoopVideo
        src={src}
        poster={poster}
        muted
        aria-hidden
        tabIndex={-1}
        fit={fit}
        onIntrinsicSize={onIntrinsicSize}
        className="pointer-events-none"
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
  const posterPath = site.hero.posterPath;
  const hasVideo = Boolean(videoPath);
  const hasPoster = Boolean(posterPath);
  const [mediaSize, setMediaSize] = useState<MediaIntrinsicSize | null>(null);

  useEffect(() => {
    setMediaSize(null);
  }, [posterPath, videoPath]);

  const onIntrinsicSize = useCallback((size: MediaIntrinsicSize) => {
    setMediaSize((current) => {
      if (
        current &&
        current.width === size.width &&
        current.height === size.height
      ) {
        return current;
      }
      return size;
    });
  }, []);

  const isPortraitVideo = Boolean(
    mediaSize && mediaSize.height > mediaSize.width,
  );
  const videoFit: VideoObjectFit = isPortraitVideo ? "contain" : "cover";

  return (
    <section className="relative grid w-full grid-cols-1 overflow-hidden">
      {/*
        In-flow sizer stacked with the copy. Portrait clips set aspect-ratio
        so the hero grows with the frame instead of cropping top and bottom.
      */}
      <div
        aria-hidden
        className={`col-start-1 row-start-1 w-full ${
          isPortraitVideo ? "" : "min-h-[85svh]"
        }`}
        style={
          mediaSize
            ? { aspectRatio: `${mediaSize.width} / ${mediaSize.height}` }
            : undefined
        }
      />
      <div className="pointer-events-none absolute inset-0">
        <PlantSectionBackground
          wallpaper={wallpaper}
          overlay={hasVideo && hasPoster ? "none" : overlay}
          priority={!hasPoster}
        />
        {hasVideo && videoPath ? (
          <HeroBackgroundVideo
            src={videoPath}
            poster={posterPath}
            fit={videoFit}
            onIntrinsicSize={onIntrinsicSize}
          />
        ) : null}
      </div>

      <div className="relative z-10 col-start-1 row-start-1 flex h-full min-h-0 flex-col px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center text-center">
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
      </div>
    </section>
  );
}
