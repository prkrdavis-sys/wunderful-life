/** Soft paper glow for text sitting over the hero video. */
export const paperTextGlow =
  "drop-shadow-[0_1px_14px_rgba(255,253,249,0.85)]";

export const paperTextGlowStrong =
  "drop-shadow-[0_2px_22px_rgba(255,253,249,0.92)]";

/** Shadow for light text on dark backgrounds. */
export const lightOnDarkShadow =
  "drop-shadow-[0_2px_18px_rgba(35,57,42,0.7)]";

/**
 * Per-section text colors. Only the hero still sits over footage, so it keeps
 * the paper glow; every other section now renders on a flat gradient wash.
 */
export const sectionText = {
  hero: {
    eyebrow: "text-ink/80",
    heading: `text-ink ${paperTextGlowStrong}`,
    subheading: `text-forest ${paperTextGlow}`,
    body: "text-ink/90",
    caption: `text-ink/85 ${paperTextGlow}`,
  },
  about: {
    heading: "text-forest",
    subheading: "text-brown",
    body: "text-ink/85",
  },
  work: {
    heading: "text-forest",
    body: "text-ink/80",
    empty: "text-ink/70",
    caption: {
      title: "text-sm font-semibold text-forest",
      brand: "text-xs font-medium text-brown",
      link: "text-xs font-semibold text-sage-deep hover:text-forest",
    },
  },
  services: {
    heading: "text-forest",
    body: "text-ink/85",
  },
  contact: {
    heading: "text-forest",
    body: "font-medium text-ink/85",
  },
} as const;
