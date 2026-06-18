"use client";

import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";
import { sectionText } from "@/lib/sectionText";

export function HeroSection() {
  const site = useSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.hero;
  const text = sectionText.hero;

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
      <PlantSectionBackground
        wallpaper={wallpaper}
        overlay={overlay}
        priority
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className={`mb-3 text-sm font-medium tracking-[0.28em] uppercase ${text.eyebrow}`}>
          {site.brand}
        </p>
        <h1 className={`font-display text-5xl leading-[1.05] sm:text-6xl md:text-7xl lg:text-8xl ${text.heading}`}>
          {site.fullName}
        </h1>
        <p className={`mt-4 font-display text-xl sm:text-2xl ${text.subheading}`}>
          UGC Creator · Creative · Nature-driven
        </p>
        <p className={`mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl ${text.body}`}>
          {site.tagline}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {site.heroLinks.map((link) => (
            <AnimatedButton
              key={link.href}
              href={link.href}
              variant={link.emphasis === "primary" ? "burgundy" : "soft"}
            >
              {link.label}
            </AnimatedButton>
          ))}
        </div>

        <p className={`mx-auto mt-8 max-w-xl text-sm leading-relaxed ${text.caption}`}>
          I&apos;m {site.name} — the face behind the frame. Brands hire me for
          deliverables; they remember me for the personality.
        </p>
      </div>
    </section>
  );
}
