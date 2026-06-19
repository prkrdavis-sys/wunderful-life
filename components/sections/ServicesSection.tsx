"use client";

import {
  SectionReveal,
  StaggerChildren,
  StaggerItem,
} from "@/components/ui/motion";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";
import { sectionText } from "@/lib/sectionText";

export function ServicesSection() {
  const site = useSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.services;
  const text = sectionText.services;

  return (
    <section
      id="services"
      className="scroll-section-anchor relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionReveal className="text-center">
          <h2 className={`font-display text-3xl sm:text-4xl ${text.heading}`}>
            Services
          </h2>
          <p className={`mx-auto mt-4 max-w-2xl leading-relaxed ${text.body}`}>
            What {site.name} delivers — plus the creative, airy, nature-driven
            personality your audience will remember.
          </p>
        </SectionReveal>

        <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2">
          {site.services.map((service) => (
            <StaggerItem
              key={service.id}
              variant="fade"
              className="glass-panel-frosted rounded-3xl border border-white/25 p-6 transition-[border-color,box-shadow] hover:border-white/40 hover:shadow-[0_16px_48px_rgb(74_69_104/0.08)]"
            >
              <h3 className="font-display text-xl text-indigo">
                {service.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-indigo/85 sm:text-base">
                {service.description}
              </p>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
