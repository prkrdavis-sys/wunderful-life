/** Border / backing accent options for about photos (and services metadata). */
export const PHOTO_ACCENTS = [
  { value: "lavender", label: "Lavender" },
  { value: "indigo", label: "Indigo" },
  { value: "burgundy", label: "Burgundy" },
  { value: "sky", label: "Sky" },
  { value: "pink", label: "Pink" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "brown", label: "Brown" },
  { value: "cream", label: "Cream" },
] as const;

export type PhotoAccent = (typeof PHOTO_ACCENTS)[number]["value"];

export const photoAccentGradients: Record<PhotoAccent | string, string> = {
  lavender: "from-lavender/55 via-lavender/22 to-cream",
  indigo: "from-indigo/35 via-indigo/12 to-cream",
  burgundy: "from-burgundy/40 via-burgundy/15 to-cream",
  sky: "from-sky/55 via-sky-deep/20 to-cream",
  pink: "from-pink/50 via-pink/20 to-cream",
  blue: "from-blue/40 via-blue/15 to-cream",
  green: "from-lavender/45 via-lavender/18 to-cream",
  yellow: "from-yellow/60 via-yellow/25 to-cream",
  brown: "from-brown-light/40 via-brown/10 to-cream",
  cream: "from-cream via-paper to-white",
};

export const DEFAULT_PHOTO_ACCENT: PhotoAccent = "lavender";

export function photoAccentGradient(accent: string): string {
  return photoAccentGradients[accent] ?? photoAccentGradients[DEFAULT_PHOTO_ACCENT];
}

export function isPhotoAccent(value: string): value is PhotoAccent {
  return PHOTO_ACCENTS.some((option) => option.value === value);
}
