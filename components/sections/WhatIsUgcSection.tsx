"use client";

import { SectionReveal, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";
import { sectionText } from "@/lib/sectionText";

export function WhatIsUgcSection() {
  const site = useSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.about;
  const text = sectionText.about;

  return (
    <section
      id="what-is-ugc"
      className="scroll-section-anchor relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionReveal className="mx-auto max-w-3xl text-center">
          <p className="font-label text-xs font-semibold tracking-[0.18em] text-burgundy/80 uppercase">
            Creator Strategy
          </p>
          <h2 className={`mt-3 font-display text-3xl sm:text-4xl ${text.heading}`}>
            {site.whatIsUgc.heading}
          </h2>
          <p className={`glass-panel mx-auto mt-6 rounded-3xl border border-white/50 px-6 py-5 text-base leading-relaxed sm:px-8 sm:text-lg ${text.body}`}>
            {site.whatIsUgc.body}
          </p>
        </SectionReveal>

        <StaggerChildren className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
          {site.whatIsUgc.highlights.map((highlight) => (
            <StaggerItem key={highlight.id}>
              <article className="h-full rounded-3xl border border-white/45 bg-paper/58 p-6 shadow-lg shadow-indigo/10 ring-1 ring-lavender/20 backdrop-blur-md">
                <h3 className="font-display text-xl text-burgundy">
                  {highlight.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-indigo/88 sm:text-base">
                  {highlight.description}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
