"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { AutoplayLoopVideo } from "@/components/ui/AutoplayLoopVideo";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { HeroEntrance } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";
import { lightOnDarkShadow, sectionText } from "@/lib/sectionText";
import type { MediaIntrinsicSize, VideoObjectFit } from "@/lib/videos/cover-fit";

const HERO_CREATOR_IMAGE = "/hero/creator-placeholder.png";

type MeasuredMedia = {
  sourceKey: string;
  size: MediaIntrinsicSize;
};

function HeroIntro() {
  const reduceMotion = useReducedMotion();
  const creatorInitial = reduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: "28%" };

  return (
    <section className="hero-intro relative z-10 isolate min-h-[34rem] overflow-visible bg-paper sm:min-h-[39rem] lg:min-h-[44rem]">
      <div
        aria-hidden
        className="hero-intro-silhouettes absolute inset-x-0 bottom-0 z-0 h-[62%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-gradient-to-b from-paper via-paper/45 to-transparent"
      />

      <p className="relative z-20 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pt-8 font-label text-[clamp(0.7rem,1.4vw,0.95rem)] font-medium tracking-[0.16em] text-brown sm:pt-10">
        <span>UGC</span>
        <span aria-hidden className="text-blush-deep">
          |
        </span>
        <span>Social media</span>
        <span aria-hidden className="text-blush-deep">
          |
        </span>
        <span>marketing</span>
      </p>

      <div className="relative z-20 mx-auto flex max-w-6xl justify-center px-4 pt-16 sm:px-6 sm:pt-20">
        <h1 className="text-center leading-[0.82] tracking-[-0.06em]">
          <span className="block font-serif text-[clamp(4.75rem,13vw,9rem)] text-blush-deep">
            Creative
          </span>
          <span className="-mt-1 block font-display text-[clamp(5rem,15vw,10.5rem)] text-forest">
            Portfolio
          </span>
        </h1>
      </div>

      <motion.div
        initial={creatorInitial}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                duration: 1.15,
                delay: 0.18,
                ease: [0.22, 1, 0.36, 1],
              }
        }
        className="pointer-events-none absolute inset-x-0 bottom-[-9rem] z-10 flex justify-center will-change-transform sm:bottom-[-12rem] lg:bottom-[-15rem]"
      >
        <div className="relative h-[31rem] w-[min(86vw,25rem)] sm:h-[36rem] sm:w-[min(58vw,29rem)] lg:h-[42rem] lg:w-[min(42vw,34rem)]">
          <Image
            src={HERO_CREATOR_IMAGE}
            alt="Emily and her partner smiling together"
            fill
            priority
            sizes="(min-width: 1024px) 34rem, (min-width: 640px) 29rem, 86vw"
            className="object-contain object-bottom"
          />
        </div>
      </motion.div>
    </section>
  );
}

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

function HeroVideoSection() {
  const site = useSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.hero;
  const text = sectionText.hero;
  const videoPath = site.hero.videoPath;
  const posterPath = site.hero.posterPath;
  const hasVideo = Boolean(videoPath);
  const hasPoster = Boolean(posterPath);
  const mediaSourceKey = `${videoPath ?? ""}\u0000${posterPath ?? ""}`;
  const [mediaSize, setMediaSize] = useState<MeasuredMedia | null>(null);
  const mediaSizeForSource =
    mediaSize?.sourceKey === mediaSourceKey ? mediaSize.size : null;

  const onIntrinsicSize = useCallback((size: MediaIntrinsicSize) => {
    setMediaSize((current) => {
      if (
        current?.sourceKey === mediaSourceKey &&
        current.size.width === size.width &&
        current.size.height === size.height
      ) {
        return current;
      }
      return { sourceKey: mediaSourceKey, size };
    });
  }, [mediaSourceKey]);

  const isPortraitVideo = Boolean(
    mediaSizeForSource &&
      mediaSizeForSource.height > mediaSizeForSource.width,
  );
  const videoFit: VideoObjectFit = isPortraitVideo ? "contain" : "cover";

  return (
    <section className="relative z-20 grid w-full grid-cols-1 overflow-hidden">
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
          mediaSizeForSource
            ? {
                aspectRatio: `${mediaSizeForSource.width} / ${mediaSizeForSource.height}`,
              }
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
              <h2
                className={`font-display text-5xl leading-[1.05] sm:text-6xl md:text-7xl lg:text-8xl ${
                  hasVideo ? `text-paper ${lightOnDarkShadow}` : text.heading
                }`}
              >
                {site.fullName}
              </h2>
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

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <HeroIntro />
      <HeroVideoSection />
    </div>
  );
}
