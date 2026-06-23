"use client";

import { motion } from "framer-motion";
import { SectionReveal } from "@/components/ui/motion";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";
import { sectionText } from "@/lib/sectionText";

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
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

function EmailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}

export function ContactSection() {
  const site = useSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.contact;
  const text = sectionText.contact;

  return (
    <section
      id="contact"
      className="scroll-section-anchor relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <SectionReveal>
          <h2 className={`font-display text-3xl sm:text-4xl ${text.heading}`}>
            {site.contact.headline}
          </h2>
          <p className={`glass-panel mx-auto mt-6 max-w-2xl rounded-2xl border border-white/50 px-6 py-5 text-base leading-relaxed sm:px-8 sm:text-lg ${text.body}`}>
            {site.contact.body}
          </p>
        </SectionReveal>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <motion.a
            href={site.social.instagram}
            aria-label="Open Instagram"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-burgundy/35 bg-paper/82 text-burgundy shadow-lg shadow-burgundy/10 ring-1 ring-white/50 backdrop-blur-md transition hover:border-burgundy/55 hover:bg-paper hover:shadow-burgundy/15"
          >
            <InstagramIcon />
          </motion.a>
          <motion.a
            href={site.social.email}
            aria-label="Send email"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-indigo/30 bg-paper/82 text-indigo shadow-lg shadow-indigo/10 ring-1 ring-white/50 backdrop-blur-md transition hover:border-indigo/50 hover:bg-paper hover:shadow-indigo/15"
          >
            <EmailIcon />
          </motion.a>
        </div>
      </div>
    </section>
  );
}
