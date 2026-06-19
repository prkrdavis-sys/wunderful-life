"use client";

import { SectionReveal } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { plantWallpapers, sectionWallpapers } from "@/lib/plants";
import { sectionText } from "@/lib/sectionText";

export function ServicesSection() {
  const site = useSiteContent();
  const { wallpaper } = sectionWallpapers.services;
  const wallpaperAsset = plantWallpapers[wallpaper];
  const text = sectionText.services;

  return (
    <section
      id="services"
      className="scroll-section-anchor relative px-4 py-20 sm:px-6 sm:py-24 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${wallpaperAsset.src})` }}
    >
      <div className="mx-auto max-w-6xl">
        <SectionReveal className="text-center">
          <h2 className={`font-display text-3xl sm:text-4xl ${text.heading}`}>
            Services
          </h2>
          <p className={`mx-auto mt-4 max-w-2xl leading-relaxed ${text.body}`}>
            What {site.name} delivers — plus the creative, airy, nature-driven
            personality your audience will remember.
          </p>
        </SectionReveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 sm:gap-10">
          {site.services.map((service) => (
            <article
              key={service.id}
              className="service-glass-card relative rounded-3xl border border-white/40 ring-1 ring-white/25 transition-[border-color,box-shadow] hover:border-white/55 hover:ring-white/35"
            >
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
          ))}
        </div>
      </div>
    </section>
  );
}
