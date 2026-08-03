"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { BrandsBanner } from "@/components/sections/BrandsBanner";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { SectionReveal, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionText } from "@/lib/sectionText";

export function ServicesSection() {
  const site = useSiteContent();
  const text = sectionText.services;

  return (
    <section id="services" className="scroll-section-anchor relative">
      <BrandsBanner />

      <div className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-24">
        <SectionSurface tone="ivory" motifs="left" />
        <AdminEditButton section="services" label="Edit services" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionReveal className="text-center">
            <p className="font-label text-xs font-semibold tracking-[0.22em] text-sage-deep uppercase">
              What I offer
            </p>
            <h2 className={`mt-3 font-serif text-3xl sm:text-5xl ${text.heading}`}>
              Services
            </h2>
            <p className={`mx-auto mt-4 max-w-2xl leading-relaxed ${text.body}`}>
              What {site.name} delivers — plus the creative, airy, nature-driven
              personality your audience will remember.
            </p>
          </SectionReveal>

          <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-8">
            {site.services.map((service) => (
              <StaggerItem key={service.id}>
                <article className="service-glass-card h-full rounded-3xl border border-white/70 bg-paper/70 p-6 backdrop-blur-sm transition hover:border-sage/60 hover:shadow-lg sm:p-7">
                  <h3 className="font-serif text-xl text-forest sm:text-2xl">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/80 sm:text-base">
                    {service.description}
                  </p>
                </article>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
}
