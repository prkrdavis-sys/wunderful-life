"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { SectionReveal, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { SectionSurface } from "@/components/ui/SectionSurface";
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
      className="scroll-section-anchor relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24"
    >
      <SectionSurface tone="lavender" motifs="edges" />
      <AdminEditButton section="testimonials" label="Edit quotes" />
      <div className="relative z-10 mx-auto max-w-6xl">
        {hiddenFromVisitors && (
          <SectionReveal className="mx-auto mb-6 max-w-xl rounded-full border border-forest/20 bg-paper/80 px-5 py-2 text-center text-sm font-medium text-forest shadow-sm backdrop-blur-md">
            Hidden from regular view. Toggle this on in the admin editor when
            testimonials are ready.
          </SectionReveal>
        )}

        <SectionReveal className="mx-auto max-w-3xl text-center">
          <p className="font-label text-xs font-semibold tracking-[0.18em] text-ink/75 uppercase">
            Social Proof
          </p>
          <h2 className={`mt-3 font-serif text-3xl sm:text-5xl ${text.heading}`}>
            {site.testimonials.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink/88 sm:text-lg">
            {site.testimonials.intro}
          </p>
        </SectionReveal>

        <StaggerChildren className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
          {site.testimonials.items.map((testimonial) => (
            <StaggerItem key={testimonial.id}>
              <figure className="glass-panel h-full rounded-[2rem] border border-white/55 px-6 py-7 text-left ring-1 ring-white/40 sm:px-8">
                <blockquote className="font-serif text-xl leading-relaxed text-forest sm:text-2xl">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 border-t border-brown/10 pt-4">
                  <p className="font-semibold text-ink">{testimonial.name}</p>
                  <p className="mt-1 text-sm text-muted">{testimonial.role}</p>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
