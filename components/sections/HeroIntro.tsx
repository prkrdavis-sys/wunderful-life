"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { SignatureHalf } from "@/components/ui/BrandLogo";
import { SectionSurface } from "@/components/ui/SectionSurface";

const HERO_CREATOR_FALLBACK = {
  src: "/hero/creator-placeholder.webp",
  width: 900,
  height: 1350,
} as const;

function HeroForestBelt() {
  return (
    <div aria-hidden className="hero-intro-belt relative z-20 overflow-hidden">
      <SectionSurface tone="forest" motifs="none" />
    </div>
  );
}

export function HeroIntro() {
  const site = useSiteContent();
  const reduceMotion = useReducedMotion();
  const creatorInitial = reduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: "16%" };
  const services = site.hero.services.filter((service) => service.trim());
  const creatorImage = site.hero.creatorImagePath ?? HERO_CREATOR_FALLBACK.src;

  // No isolate / z-index on this section. The stage is pulled up over the
  // belt so the cutout sits behind the strip and the video below.
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
        <p className="relative z-20 flex w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 pt-4 font-label text-[clamp(0.7rem,2.4vw,1.45rem)] font-medium tracking-[0.06em] text-brown sm:gap-x-4 sm:px-4 sm:pt-5 sm:tracking-[0.16em]">
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
                className="h-full w-full object-cover object-top"
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
      </div>

      <h1 className="hero-intro-title">
        <span className="block font-serif text-[clamp(1.45rem,7vw,4.6rem)] text-sage-deep">
          {site.hero.titleLine}
        </span>
        <span className="-mt-1 block font-cooper text-[clamp(1.75rem,10.5vw,7.5rem)] text-forest uppercase">
          {site.hero.titleAccent}
        </span>
      </h1>

      <HeroForestBelt />
    </section>
  );
}
