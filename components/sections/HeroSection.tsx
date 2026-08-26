"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { AutoplayLoopVideo } from "@/components/ui/AutoplayLoopVideo";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { HeroEntrance } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { SignatureHalf } from "@/components/ui/BrandLogo";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { sectionWallpapers } from "@/lib/plants";
import { lightOnDarkShadow, sectionText } from "@/lib/sectionText";
import type { MediaIntrinsicSize, VideoObjectFit } from "@/lib/videos/cover-fit";

const HERO_CREATOR_IMAGE = "/hero/creator-placeholder.png";

type MeasuredMedia = {
  sourceKey: string;
  size: MediaIntrinsicSize;
};

function HeroForestBelt() {
  return (
    <div
      aria-hidden
      className="relative z-0 h-14 overflow-hidden sm:h-16"
    >
      <SectionSurface tone="forest" motifs="none" />
    </div>
  );
}

function HeroIntro() {
  const reduceMotion = useReducedMotion();
  const creatorInitial = reduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: "16%" };

  return (
    <section className="hero-intro relative z-10 isolate overflow-visible bg-paper">
      <div
        aria-hidden
        className="hero-intro-silhouettes absolute inset-x-0 bottom-0 z-0 h-[90%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-gradient-to-b from-paper via-paper/45 to-transparent"
      />

      <p className="relative z-20 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pt-4 font-label text-[clamp(0.7rem,1.4vw,0.95rem)] font-medium tracking-[0.16em] text-brown sm:pt-5">
        <span>UGC</span>
        <span aria-hidden className="text-sage-deep">
          |
        </span>
        <span>Social media</span>
        <span aria-hidden className="text-sage-deep">
          |
        </span>
        <span>marketing</span>
      </p>

      <div className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-center gap-[clamp(0.35rem,1.4vw,1.1rem)] px-3 pb-7 pt-1 sm:px-6 sm:pb-8">
        <div
          aria-hidden
          className="w-[min(27vw,10.25rem)] shrink-0 sm:w-[11.5rem] lg:w-[13rem]"
        >
          <SignatureHalf
            side="first"
            alt=""
            sizes="(min-width: 1024px) 13rem, 27vw"
            className="w-full"
          />
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
          className="relative z-10 -mb-10 h-[22rem] w-[min(52vw,16.5rem)] shrink-0 will-change-transform sm:-mb-12 sm:h-[26rem] sm:w-[19.5rem] lg:-mb-14 lg:h-[30rem] lg:w-[22.5rem]"
        >
          <Image
            src={HERO_CREATOR_IMAGE}
            alt="Emily and her partner smiling together"
            fill
            priority
            sizes="(min-width: 1024px) 22.5rem, (min-width: 640px) 19.5rem, 52vw"
            className="object-contain object-bottom"
          />
        </motion.div>

        <div
          aria-hidden
          className="w-[min(32vw,12.25rem)] shrink-0 sm:w-[13.5rem] lg:w-[15.5rem]"
        >
          <SignatureHalf
            side="last"
            alt=""
            sizes="(min-width: 1024px) 15.5rem, 32vw"
            className="w-full"
          />
        </div>

        <h1 className="pointer-events-none absolute bottom-0 left-0 z-30 max-w-[92%] px-4 pb-1 text-left leading-[0.78] tracking-[-0.04em] sm:max-w-[80%] sm:px-7 sm:pb-2 lg:max-w-[72%] lg:px-10">
          <span className="block font-serif text-[clamp(2.1rem,7vw,4.6rem)] text-sage-deep">
            Creative
          </span>
          <span className="-mt-1 block font-cooper text-[clamp(2.7rem,12vw,7.5rem)] text-forest uppercase">
            Portfolio
          </span>
        </h1>
      </div>

      <HeroForestBelt />
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
    <section className="relative z-0 grid w-full grid-cols-1 overflow-hidden">
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
