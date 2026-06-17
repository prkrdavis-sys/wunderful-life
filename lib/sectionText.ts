/** Soft paper glow for text over photographic wallpapers. */
export const paperTextGlow =
  "drop-shadow-[0_1px_14px_rgba(255,253,249,0.85)]";

export const paperTextGlowStrong =
  "drop-shadow-[0_2px_22px_rgba(255,253,249,0.92)]";

/** Shadow for light text on dark photographic backgrounds. */
export const lightOnDarkShadow =
  "drop-shadow-[0_2px_18px_rgba(26,24,40,0.75)]";

/** Per-section text colors tuned for each wallpaper background. */
export const sectionText = {
  hero: {
    eyebrow: "text-indigo/80",
    heading: `text-indigo ${paperTextGlowStrong}`,
    subheading: `text-burgundy ${paperTextGlow}`,
    body: "text-indigo/90",
    caption: `text-indigo/85 ${paperTextGlow}`,
  },
  about: {
    heading: `text-indigo ${paperTextGlow}`,
    subheading: `text-burgundy/95 ${paperTextGlow}`,
    body: "text-indigo/88",
  },
  work: {
    heading: `text-paper ${lightOnDarkShadow}`,
    body: `text-lavender ${lightOnDarkShadow}`,
    empty: "text-paper/85",
  },
  services: {
    heading: `text-indigo ${paperTextGlowStrong}`,
    body: "text-indigo/88",
  },
  contact: {
    heading: `text-burgundy ${paperTextGlowStrong}`,
    body: "font-medium text-indigo",
  },
} as const;
