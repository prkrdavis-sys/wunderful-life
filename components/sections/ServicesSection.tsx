"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { SectionReveal, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionText } from "@/lib/sectionText";

export function ServicesSection() {
  const site = useSiteContent();
  const text = sectionText.services;

  return (
    <section
      id="services"
      className="scroll-section-anchor relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-24"
    >
      <SectionSurface tone="lavender" motifs="scatter" />
      <SectionButterfly flight="brandsBand" />
      <SectionButterfly flight="services" />
      <SectionButterfly flight="servicesHigh" />
      <AdminEditButton section="services" label="Edit services" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionReveal variant="fadeUp" className="text-center">
          <h2 className={`font-didone text-3xl font-black tracking-tight sm:text-5xl ${text.heading}`}>
            {site.services.heading}
          </h2>
          <p className={`mx-auto mt-4 max-w-2xl leading-relaxed ${text.body}`}>
            {site.services.subtitle}
          </p>
        </SectionReveal>

        <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-8">
          {site.services.items.map((service, index) => (
            <StaggerItem
              key={service.id}
              variant={index % 2 === 0 ? "fadeLeft" : "fadeRight"}
            >
              <article className="service-glass-card h-full rounded-3xl border border-white/70 bg-paper/70 p-6 backdrop-blur-sm transition hover:border-lavender/60 hover:shadow-lg sm:p-7">
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
    </section>
  );
}
