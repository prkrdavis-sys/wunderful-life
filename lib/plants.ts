/**
 * Botanical wallpaper images — Unsplash & Pexels (free for commercial use).
 * Adobe Stock–style monstera leaf wallpapers: https://stock.adobe.com/search?k=monstera+leaf+wallpaper
 */
const BOTANICAL_PEXELS_TUNE = {
  saturation: 1.35,
  contrast: 1.1,
} as const;

export type PlantWallpaperAsset = {
  src: string;
  alt: string;
  credit: string;
  position: string;
  saturation?: number;
  contrast?: number;
};

export const plantWallpapers = {
  "hero-sky": {
    src: "/plants/wallpaper-hero-pexels.jpg",
    alt: "Dramatic sun rays through storm clouds",
    credit: "Pexels",
    position: "center center",
    saturation: 1.3,
    contrast: 1.15,
  },
  "monstera-pale-wall": {
    src: "/plants/wallpaper-monstera-wall.jpg",
    alt: "Large monstera leaves against a pale wall",
    credit: "Rory Tucker / Unsplash",
    position: "center top",
  },
  "work-pexels": {
    src: "/plants/wallpaper-work-pexels.jpg",
    alt: "Lush green plant leaves",
    credit: "Pexels",
    position: "center center",
    ...BOTANICAL_PEXELS_TUNE,
  },
  "monstera-tiled-wall": {
    src: "/plants/wallpaper-selected-work.jpg",
    alt: "Monstera deliciosa leaves against a white tiled wall",
    credit: "Jannet Serhan / Unsplash",
    position: "center top",
  },
  "contact-pexels": {
    src: "/plants/wallpaper-contact-pexels.jpg",
    alt: "Soft pink and green botanical leaves",
    credit: "Pexels",
    position: "center center",
    saturation: 1.3,
    contrast: 1.1,
  },
  "monstera-variegated": {
    src: "/plants/wallpaper-create-together.jpg",
    alt: "Variegated monstera leaves against a pale wall",
    credit: "Fujiphilm / Unsplash",
    position: "center top",
  },
  "about-sky": {
    src: "/plants/wallpaper-about-sky.jpg",
    alt: "Soft pastel sunset sky",
    credit: "Emily Wunder",
    position: "center center",
    saturation: 1.5,
    contrast: 1.12,
  },
  "jungle-leaves": {
    src: "/plants/wallpaper-jungle-leaves.jpg",
    alt: "Lush jungle foliage",
    credit: "Magda Ehlers / Pexels",
    position: "center",
  },
  "services-pexels": {
    src: "/plants/wallpaper-services-pexels.jpg",
    alt: "Botanical plant leaves",
    credit: "Pexels",
    position: "center center",
    ...BOTANICAL_PEXELS_TUNE,
  },
  "fern-wall": {
    src: "/plants/wallpaper-fern-wall.jpg",
    alt: "Fern leaves on white",
    credit: "Yufan Jiang / Pexels",
    position: "center top",
  },
  "palm-leaves": {
    src: "/plants/wallpaper-palm-leaves.jpg",
    alt: "Palm fronds",
    credit: "Pexels",
    position: "center",
  },
} satisfies Record<string, PlantWallpaperAsset>;

export type PlantWallpaperId = keyof typeof plantWallpapers;

export type WallpaperOverlay = "minimal" | "light" | "medium" | "heavy";

export type SectionWallpaperConfig = {
  wallpaper: PlantWallpaperId;
  overlay?: WallpaperOverlay;
};

export const sectionWallpapers: Record<string, SectionWallpaperConfig> = {
  hero: { wallpaper: "hero-sky", overlay: "minimal" },
  about: { wallpaper: "about-sky", overlay: "minimal" },
  services: { wallpaper: "services-pexels", overlay: "minimal" },
  work: { wallpaper: "work-pexels", overlay: "minimal" },
  contact: { wallpaper: "contact-pexels", overlay: "minimal" },
  workPage: { wallpaper: "services-pexels", overlay: "minimal" },
};
