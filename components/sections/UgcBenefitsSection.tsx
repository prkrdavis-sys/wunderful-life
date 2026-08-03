"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { DecorMotifs } from "@/components/ui/DecorMotifs";
import { SectionReveal, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { useSiteContent } from "@/components/admin/AdminViewProvider";

/** Rotating tones for the circular stat cards, however many there are. */
const STAT_TONES = ["light", "paper", "dark"] as const;

/**
 * The UGC explainer and proof points, merged from the former "What Is UGC?"
 * and "Why UGC?" sections into one anchor.
 */
export function UgcBenefitsSection() {
  const site = useSiteContent();
  const { whatIsUgc, ugcBenefits } = site;

  return (
    <section
      id="ugc"
      aria-labelledby="ugc-heading"
      className="ugc-benefits-section scroll-section-anchor relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24"
    >
      <DecorMotifs preset="scatter" tone="paper" />
      <AdminEditButton section="ugc" label="Edit UGC" tone="light" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="font-label text-xs font-semibold tracking-[0.22em] text-paper/80 uppercase">
            {ugcBenefits.eyebrow}
          </p>
          <h2
            id="ugc-heading"
            className="mt-3 font-serif text-4xl tracking-tight text-paper sm:text-6xl"
          >
            {whatIsUgc.heading}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-paper/85 sm:text-base">
            {whatIsUgc.body}
          </p>
        </SectionReveal>

        {ugcBenefits.stats.length > 0 && (
          <StaggerChildren className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3 sm:gap-6">
            {ugcBenefits.stats.map((stat, index) => (
              <StaggerItem key={stat.id}>
                <article
                  className={`ugc-stat-card ugc-stat-card-${STAT_TONES[index % STAT_TONES.length]}`}
                >
                  <p className="font-serif text-4xl leading-none sm:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-4 max-w-[12rem] text-center text-xs leading-relaxed sm:text-sm">
                    {stat.label}
                  </p>
                </article>
              </StaggerItem>
            ))}
          </StaggerChildren>
        )}

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <SectionReveal className="text-center lg:text-left">
            <p className="font-label text-xs font-semibold tracking-[0.2em] text-paper/80 uppercase">
              {ugcBenefits.calloutLabel}
            </p>
            <p className="mt-3 font-serif text-7xl leading-none text-paper sm:text-8xl">
              {ugcBenefits.calloutValue}
            </p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-paper/85 lg:mx-0 sm:text-base">
              {ugcBenefits.calloutBody}
            </p>
          </SectionReveal>

          <SectionReveal
            delay={0.12}
            className="ugc-benefits-card rounded-[2rem] border border-paper/40 p-6 text-ink shadow-xl sm:p-8"
          >
            <p className="font-label text-xs font-semibold tracking-[0.2em] text-forest/80 uppercase">
              UGC benefits
            </p>
            <h3 className="mt-2 font-serif text-2xl text-forest sm:text-3xl">
              {ugcBenefits.benefitsHeading}
            </h3>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {ugcBenefits.benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 text-sm leading-relaxed"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest text-xs text-paper"
                  >
                    ✓
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
