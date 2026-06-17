"use client";

import { motion } from "framer-motion";
import { SectionReveal } from "@/components/ui/motion";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";

export function ContactSection() {
  const site = useSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.contact;

  return (
    <section
      id="contact"
      className="relative scroll-mt-24 overflow-hidden px-4 py-20 sm:px-6 sm:py-24"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <SectionReveal>
          <h2 className="font-display text-3xl text-brown sm:text-4xl">
            Let&apos;s Create Together
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            Want content that converts and a creator brands actually want to
            work with again? Hi — I&apos;m {site.name}. Let&apos;s chat.
          </p>
        </SectionReveal>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <motion.a
            href={site.social.instagram}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full border border-pink/40 bg-white/80 px-8 py-4 text-sm font-semibold text-brown shadow-sm transition hover:border-pink hover:bg-white"
          >
            Instagram
          </motion.a>
          <motion.a
            href={site.social.email}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full border border-green/40 bg-white/80 px-8 py-4 text-sm font-semibold text-brown shadow-sm transition hover:border-green hover:bg-white"
          >
            Email
          </motion.a>
        </div>
      </div>
    </section>
  );
}
