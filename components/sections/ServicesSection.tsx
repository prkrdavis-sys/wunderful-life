"use client";

import { SectionReveal, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { ScallopedBanner } from "@/components/ui/ScallopedBanner";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { plantWallpapers, sectionWallpapers } from "@/lib/plants";
import { sectionText } from "@/lib/sectionText";

export function ServicesSection() {
  const site = useSiteContent();
  const { wallpaper } = sectionWallpapers.services;
  const wallpaperAsset = plantWallpapers[wallpaper];
  const text = sectionText.services;

  return (
    <section id="services" className="scroll-section-anchor relative">
      <ScallopedBanner>
        <SectionReveal className="text-center">
          <h2 className="font-display text-3xl text-paper sm:text-4xl">
            Services
          </h2>
          <ul className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:mt-8 sm:justify-between sm:gap-x-4">
            {site.services.map((service) => (
              <li
                key={service.id}
                className="font-label text-sm font-medium tracking-[0.04em] text-paper/88 sm:text-base"
              >
                {service.title}
              </li>
            ))}
          </ul>
        </SectionReveal>
      </ScallopedBanner>

      <div
        className="bg-cover bg-center bg-no-repeat px-4 pt-14 pb-20 sm:px-6 sm:pt-16 sm:pb-24"
        style={{ backgroundImage: `url(${wallpaperAsset.src})` }}
      >
        <div className="mx-auto max-w-6xl">
          <SectionReveal className="text-center">
            <p className={`mx-auto max-w-2xl leading-relaxed ${text.body}`}>
              What {site.name} delivers — plus the creative, airy, nature-driven
              personality your audience will remember.
            </p>
          </SectionReveal>

          <StaggerChildren className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-10">
            {site.services.map((service) => (
              <StaggerItem key={service.id}>
                <article className="service-glass-card relative h-full rounded-3xl border border-white/40 ring-1 ring-white/25 transition-[border-color,box-shadow] hover:border-white/55 hover:ring-white/35">
                  <div className="service-glass-layer rounded-[inherit]" aria-hidden />
                  <div className="relative p-6">
                    <h3 className="font-display text-xl text-indigo drop-shadow-[0_1px_8px_rgba(255,253,249,0.65)]">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-indigo/90 drop-shadow-[0_1px_8px_rgba(255,253,249,0.55)] sm:text-base">
                      {service.description}
                    </p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
}
