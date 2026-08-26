"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { AutoplayLoopVideo } from "@/components/ui/AutoplayLoopVideo";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { HeroEntrance } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { SignatureHalf } from "@/components/ui/BrandLogo";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { sectionWallpapers } from "@/lib/plants";
import { lightOnDarkShadow, sectionText } from "@/lib/sectionText";
import type { MediaIntrinsicSize, VideoObjectFit } from "@/lib/videos/cover-fit";

const HERO_CREATOR_FALLBACK = {
  src: "/hero/creator-placeholder.webp",
  width: 900,
  height: 1350,
} as const;

type MeasuredMedia = {
  sourceKey: string;
  size: MediaIntrinsicSize;
};

function HeroForestBelt() {
  return (
    <div
      aria-hidden
      className="hero-intro-belt relative z-20 h-14 overflow-hidden sm:h-16"
    >
      <SectionSurface tone="forest" motifs="none" />
    </div>
  );
}

function HeroIntro() {
  const site = useSiteContent();
  const reduceMotion = useReducedMotion();
  const creatorInitial = reduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: "16%" };
  const services = site.hero.services.filter((service) => service.trim());
  const creatorImage = site.hero.creatorImagePath ?? HERO_CREATOR_FALLBACK.src;

  // No isolate / z-index on this section: the cutout must share a
  // stacking context with the forest belt and video so they cover its feet.
  return (
    <section className="hero-intro relative overflow-visible bg-paper">
      <AdminEditButton section="hero" label="Edit hero" />
      <div
        aria-hidden
        className="hero-intro-silhouettes absolute inset-x-0 bottom-0 z-0 h-[90%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-gradient-to-b from-paper via-paper/45 to-transparent"
      />

      {services.length > 0 ? (
        <p className="relative z-20 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 pt-4 font-label text-[clamp(0.75rem,2.6vw,1.45rem)] font-medium tracking-[0.08em] text-brown sm:gap-x-4 sm:px-4 sm:pt-5 sm:tracking-[0.16em]">
          {services.map((service, index) => (
            <span key={`${service}-${index}`} className="contents">
              {index > 0 ? (
                <span aria-hidden className="text-sage-deep">
                  |
                </span>
              ) : null}
              <span>{service}</span>
            </span>
          ))}
        </p>
      ) : null}

      <div className="hero-intro-stage">
        <div className="hero-intro-composer">
          <div
            aria-hidden
            className="hero-intro-signature hero-intro-signature-first"
          >
            <SignatureHalf
              side="first"
              alt=""
              sizes="(min-width: 1024px) 13rem, 28vw"
              preload
              className="w-full"
            />
          </div>

          <div className="hero-intro-creator-slot">
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
              className="hero-intro-creator-image will-change-transform"
            >
              <Image
                key={creatorImage}
                src={creatorImage}
                alt={`${site.fullName} in the hero`}
                width={HERO_CREATOR_FALLBACK.width}
                height={HERO_CREATOR_FALLBACK.height}
                preload
                sizes="(min-width: 1024px) 22.5rem, 42vw"
                className="h-auto w-full object-contain object-top"
              />
            </motion.div>
          </div>

          <div
            aria-hidden
            className="hero-intro-signature hero-intro-signature-last"
          >
            <SignatureHalf
              side="last"
              alt=""
              sizes="(min-width: 1024px) 15.5rem, 32vw"
              loading="eager"
              className="w-full"
            />
          </div>
        </div>

        <h1 className="hero-intro-title">
          <span className="block font-serif text-[clamp(1.7rem,7vw,4.6rem)] text-sage-deep">
            {site.hero.titleLine}
          </span>
          <span className="-mt-1 block font-cooper text-[clamp(2.1rem,10.5vw,7.5rem)] text-forest uppercase">
            {site.hero.titleAccent}
          </span>
        </h1>
      </div>

      <HeroForestBelt />
    </section>
  );
}

function usePortraitOrientation() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(orientation: portrait)");
    const sync = () => setIsPortrait(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isPortrait;
}

function ratioPaddingTop(size: MediaIntrinsicSize): string {
  if (size.width < 1) return "177.78%";
  return `${(size.height / size.width) * 100}%`;
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
        eager
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

  const isPortraitOrientation = usePortraitOrientation();
  const isPortraitVideo = Boolean(
    mediaSizeForSource &&
      mediaSizeForSource.height > mediaSizeForSource.width,
  );
  const useExactRatio = Boolean(
    hasVideo && (isPortraitVideo || isPortraitOrientation),
  );
  const videoFit: VideoObjectFit = useExactRatio ? "contain" : "cover";
  const sizerSize = mediaSizeForSource ?? { width: 9, height: 16 };

  return (
    <section
      className="hero-video-band relative z-20 w-full overflow-hidden bg-forest-deep"
      data-exact={useExactRatio ? "true" : "false"}
      data-has-ratio={hasVideo ? "true" : "false"}
    >
      <div className="relative z-10 grid w-full grid-cols-1">
        {/*
          Padding-top % lives on a block box inside the grid item. Putting
          aspect-ratio on the grid item itself is ignored in Safari, which
          left portrait clips in an 85svh cover box and cropped them.
        */}
        <div className="hero-video-sizers col-start-1 row-start-1 min-w-0">
          {hasVideo ? (
            <div
              aria-hidden
              className="hero-video-sizer-exact w-full"
              style={{
                ["--hero-ratio-padding" as string]: ratioPaddingTop(sizerSize),
              }}
            />
          ) : null}
          <div
            aria-hidden
            className="hero-video-sizer-cover w-full min-h-[85svh]"
          />
        </div>

        <div className="relative z-10 col-start-1 row-start-1 flex items-center justify-center self-stretch px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center">
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
            <HeroEntrance delay={0.24}>
              <p
                className={`font-script mx-auto mt-5 max-w-2xl text-3xl leading-snug sm:mt-6 sm:text-4xl ${
                  hasVideo ? `text-paper ${lightOnDarkShadow}` : text.caption
                }`}
              >
                {site.hero.subtitle}
              </p>
            </HeroEntrance>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-0">
        <PlantSectionBackground
          wallpaper={wallpaper}
          overlay={hasVideo && hasPoster ? "none" : overlay}
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
