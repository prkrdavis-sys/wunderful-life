"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { useAdminView, useSiteContent } from "@/components/admin/AdminViewProvider";
import { BrandLogo, SIGNATURE } from "@/components/ui/BrandLogo";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { EmilyPhoto } from "@/components/ui/EmilyPhoto";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { SectionReveal } from "@/components/ui/motion";

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 sm:h-6 sm:w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M17.35 6.75h.01" />
    </svg>
  );
}

export function ClosingCtaSection() {
  const site = useSiteContent();
  const { viewMode } = useAdminView();
  const { closingCta, social } = site;
  const showPhoto = Boolean(closingCta.photo.imagePath) || viewMode === "admin";

  return (
    <section
      id="contact"
      aria-labelledby="closing-cta-heading"
      className="scroll-section-anchor relative overflow-hidden px-4 pt-16 pb-8 sm:px-6 sm:pt-24 sm:pb-10"
    >
      <SectionSurface tone="ivory" motifs="scatter" />
      <SectionButterfly flight="closing" />
      <SectionButterfly flight="closingFar" />
      <AdminEditButton section="cta" label="Edit CTA" />

      <SectionReveal
        variant="slideFromLeft"
        duration={0.9}
        className={`relative z-10 mx-auto grid max-w-5xl items-center gap-10 sm:gap-14 ${
          showPhoto ? "lg:grid-cols-[0.85fr_1.15fr]" : ""
        }`}
      >
        {showPhoto ? (
          <div className="mx-auto w-full max-w-xs lg:max-w-none">
            <EmilyPhoto photo={closingCta.photo} size="lg" />
          </div>
        ) : null}

        <div className="text-center lg:text-left">
          <h2
            id="closing-cta-heading"
            className="font-script pb-1 text-5xl leading-[1.15] text-forest sm:text-7xl"
          >
            {closingCta.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink/80 lg:mx-0 sm:text-base">
            {closingCta.body}
          </p>

          <div className="mt-8 flex flex-row items-center justify-center gap-4 lg:justify-start">
            <motion.a
              href={social.email}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center rounded-full bg-forest px-8 py-3.5 font-label text-sm font-semibold tracking-[0.03em] text-paper underline underline-offset-4 shadow-lg transition hover:bg-forest-deep sm:text-base"
            >
              {closingCta.emailLabel}
            </motion.a>

            <motion.a
              href={social.instagram}
              aria-label="Open Instagram"
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex aspect-square shrink-0 items-center justify-center rounded-full border border-forest/25 bg-paper/80 p-3.5 text-forest shadow-sm backdrop-blur-sm transition hover:border-forest/50 hover:bg-paper"
            >
              <InstagramIcon />
            </motion.a>
          </div>

          <div className="mx-auto mt-9 w-[min(100%,16.5rem)] sm:mt-10 sm:w-[20rem] lg:mx-0 lg:mt-12 lg:ml-1 lg:w-[22.5rem]">
            <figure className="mx-auto w-[83.5%] px-1 pt-2">
              <Image
                src={SIGNATURE.src}
                alt="Emily Wunden"
                width={SIGNATURE.width}
                height={SIGNATURE.height}
                sizes="(max-width: 640px) 13.75rem, (max-width: 1024px) 16.25rem, 18.5rem"
                className="h-auto w-full origin-center -rotate-1 mix-blend-multiply"
              />
            </figure>

            <figure className="mt-2 sm:mt-3">
              <BrandLogo
                alt={site.fullName || "Logo"}
                sizes="(max-width: 640px) 16.5rem, (max-width: 1024px) 20rem, 22.5rem"
                className="h-auto w-full"
              />
            </figure>
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}
