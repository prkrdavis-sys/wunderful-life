"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { SectionReveal, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { TestimonialCloud } from "@/components/ui/TestimonialCloud";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { sectionText } from "@/lib/sectionText";

export function TestimonialsSection() {
  const { site, viewMode } = useAdminView();
  const text = sectionText.contact;
  const hiddenFromVisitors = !site.testimonials.visible;

  if (hiddenFromVisitors && viewMode !== "admin") {
    return null;
  }

  return (
    <section
      id="testimonials"
      className="scroll-section-anchor relative overflow-hidden px-4 pt-8 pb-20 sm:px-6 sm:pt-10 sm:pb-24"
    >
      <AdminEditButton section="testimonials" label="Edit quotes" />
      <SectionButterfly flight="testimonials" />
      <SectionButterfly flight="testimonialsLow" />
      <div className="relative z-10 mx-auto max-w-6xl">
        {hiddenFromVisitors && (
          <SectionReveal variant="fadeUp" className="mx-auto mb-6 max-w-xl rounded-full border border-forest/20 bg-paper/80 px-5 py-2 text-center text-sm font-medium text-forest shadow-sm backdrop-blur-md">
            Hidden from regular view. Toggle this on in the admin editor when
            testimonials are ready.
          </SectionReveal>
        )}

        <SectionReveal variant="fadeUp" className="mx-auto max-w-3xl text-center">
          <h2 className={`font-didone text-3xl font-bold tracking-tight sm:text-5xl ${text.heading}`}>
            {site.testimonials.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink/88 sm:text-lg">
            {site.testimonials.intro}
          </p>
        </SectionReveal>

        <StaggerChildren className="mx-auto mt-10 grid max-w-5xl gap-8 md:grid-cols-2 md:gap-10">
          {site.testimonials.items.map((testimonial, index) => (
            <StaggerItem
              key={testimonial.id}
              variant={index % 2 === 0 ? "fadeLeft" : "fadeRight"}
            >
              <TestimonialCloud flip={index % 2 === 1}>
                <blockquote className="font-serif text-xl leading-relaxed text-forest sm:text-2xl">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 border-t border-brown/10 pt-4">
                  <p className="font-semibold text-ink">{testimonial.name}</p>
                  <p className="mt-1 text-sm text-muted">{testimonial.role}</p>
                </figcaption>
              </TestimonialCloud>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
