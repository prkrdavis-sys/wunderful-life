"use client";

import { motion } from "framer-motion";
import { SectionReveal } from "@/components/ui/motion";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";
import { sectionText } from "@/lib/sectionText";

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
            Let&apos;s Create Together
          </h2>
          <p className={`glass-panel mx-auto mt-6 max-w-2xl rounded-2xl border border-white/50 px-6 py-5 text-base leading-relaxed sm:px-8 sm:text-lg ${text.body}`}>
            Want content that converts and a creator brands actually want to
            work with again? Hi — I&apos;m {site.name}. Let&apos;s chat.
          </p>
        </SectionReveal>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <motion.a
            href={site.social.instagram}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full border border-burgundy/45 bg-paper/92 px-8 py-4 text-sm font-semibold text-burgundy shadow-sm backdrop-blur-sm transition hover:border-burgundy hover:bg-paper"
          >
            Instagram
          </motion.a>
          <motion.a
            href={site.social.email}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full border border-indigo/35 bg-paper/92 px-8 py-4 text-sm font-semibold text-indigo shadow-sm backdrop-blur-sm transition hover:border-indigo/55 hover:bg-paper"
          >
            Email
          </motion.a>
        </div>
      </div>
    </section>
  );
}
