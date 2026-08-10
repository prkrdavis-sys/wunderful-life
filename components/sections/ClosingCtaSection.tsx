"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { SectionReveal } from "@/components/ui/motion";

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 sm:h-6 sm:w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M17.35 6.75h.01" />
    </svg>
  );
}

function CtaVideo({ videoPath }: { videoPath?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  if (!videoPath) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[2rem] border border-white/70 bg-paper/60 p-6 text-center shadow-lg backdrop-blur-sm">
        <p className="font-label text-xs font-semibold tracking-[0.16em] text-brown/70 uppercase">
          Upload a video in the site editor
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-white/70 shadow-xl">
      <video
        ref={videoRef}
        src={videoPath}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      <button
        type="button"
        onClick={() => setMuted((current) => !current)}
        aria-pressed={!muted}
        className="absolute right-3 bottom-3 rounded-full border border-white/50 bg-forest-deep/70 px-3 py-1.5 font-label text-[11px] font-semibold tracking-[0.12em] text-paper uppercase backdrop-blur-md transition hover:bg-forest-deep"
      >
        {muted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}

export function ClosingCtaSection() {
  const site = useSiteContent();
  const { closingCta, social } = site;

  return (
    <section
      id="contact"
      aria-labelledby="closing-cta-heading"
      className="scroll-section-anchor relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24"
    >
      <SectionSurface tone="ivory" motifs="scatter" />
      <SectionButterfly flight="closing" />
      <SectionButterfly flight="closingFar" />
      <AdminEditButton section="cta" label="Edit CTA" />

      <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-10 sm:gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionReveal className="mx-auto w-full max-w-xs lg:max-w-none">
          <CtaVideo videoPath={closingCta.videoPath} />
        </SectionReveal>

        <SectionReveal delay={0.12} className="text-center lg:text-left">
          <h2
            id="closing-cta-heading"
            className="font-script text-5xl leading-[1.05] text-forest sm:text-7xl"
          >
            {closingCta.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink/80 lg:mx-0 sm:text-base">
            {closingCta.body}
          </p>

          <div className="mt-8 flex flex-row items-center justify-center gap-4 lg:justify-start">
            <motion.a
              href={social.email}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center rounded-full bg-forest px-8 py-3.5 font-label text-sm font-semibold tracking-[0.03em] text-paper underline underline-offset-4 shadow-lg transition hover:bg-forest-deep sm:text-base"
            >
              {closingCta.emailLabel}
            </motion.a>

            <motion.a
              href={social.instagram}
              aria-label="Open Instagram"
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex aspect-square shrink-0 items-center justify-center rounded-full border border-forest/25 bg-paper/80 p-3.5 text-forest shadow-sm backdrop-blur-sm transition hover:border-forest/50 hover:bg-paper"
            >
              <InstagramIcon />
            </motion.a>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
