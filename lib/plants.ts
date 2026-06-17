/**
 * Botanical wallpaper images — Unsplash & Pexels (free for commercial use).
 * Adobe Stock–style monstera leaf wallpapers: https://stock.adobe.com/search?k=monstera+leaf+wallpaper
 */
export const plantWallpapers = {
  "monstera-pale-wall": {
    src: "/plants/wallpaper-monstera-wall.jpg",
    alt: "Large monstera leaves against a pale wall",
    credit: "Rory Tucker / Unsplash",
    position: "center top",
  },
  "monstera-tiled-wall": {
    src: "/plants/wallpaper-selected-work.jpg",
    alt: "Monstera deliciosa leaves against a white tiled wall",
    credit: "Jannet Serhan / Unsplash",
    position: "center top",
  },
  "monstera-variegated": {
    src: "/plants/wallpaper-create-together.jpg",
    alt: "Variegated monstera leaves against a pale wall",
    credit: "Fujiphilm / Unsplash",
    position: "center top",
  },
  "jungle-leaves": {
    src: "/plants/wallpaper-jungle-leaves.jpg",
    alt: "Lush jungle foliage",
    credit: "Magda Ehlers / Pexels",
    position: "center",
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
} as const;

export type PlantWallpaperId = keyof typeof plantWallpapers;

export type WallpaperOverlay = "light" | "medium" | "heavy";

export type SectionWallpaperConfig = {
  wallpaper: PlantWallpaperId;
  overlay?: WallpaperOverlay;
};

export const sectionWallpapers: Record<string, SectionWallpaperConfig> = {
  hero: { wallpaper: "monstera-pale-wall", overlay: "light" },
  about: { wallpaper: "jungle-leaves", overlay: "medium" },
  services: { wallpaper: "fern-wall", overlay: "medium" },
  work: { wallpaper: "monstera-tiled-wall", overlay: "light" },
  contact: { wallpaper: "monstera-variegated", overlay: "light" },
};
