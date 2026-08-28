import type { MediaUploadDir } from "@/lib/storage/media-upload";

export const PHOTO_KINDS = [
  "about",
  "collage",
  "brandLogo",
  "heroCreator",
  "ctaPhoto",
  "statsPhoto",
] as const;
export type PhotoKind = (typeof PHOTO_KINDS)[number];

export type PhotoKindDescriptor = {
  kind: PhotoKind;
  endpoint: string;
  folder: MediaUploadDir;
  noun: string;
  /** When true, POST/DELETE the endpoint itself instead of `endpoint/:id`. */
  singleton?: boolean;
};

export const PHOTO_KIND_DESCRIPTORS: Record<PhotoKind, PhotoKindDescriptor> = {
  about: {
    kind: "about",
    endpoint: "/api/site/photos",
    folder: "about-photos",
    noun: "photo",
  },
  collage: {
    kind: "collage",
    endpoint: "/api/site/collage-photos",
    folder: "home-grid-photos",
    noun: "photo",
  },
  brandLogo: {
    kind: "brandLogo",
    endpoint: "/api/site/brand-logos",
    folder: "brand-logos",
    noun: "logo",
  },
  heroCreator: {
    kind: "heroCreator",
    endpoint: "/api/site/hero-creator",
    folder: "hero-photos",
    noun: "creator photo",
    singleton: true,
  },
  ctaPhoto: {
    kind: "ctaPhoto",
    endpoint: "/api/site/cta-photo",
    folder: "cta-photos",
    noun: "CTA photo",
    singleton: true,
  },
  statsPhoto: {
    kind: "statsPhoto",
    endpoint: "/api/site/stats-photos",
    folder: "stats-photos",
    noun: "photo",
  },
};

export function photoKindDescriptor(kind: PhotoKind): PhotoKindDescriptor {
  return PHOTO_KIND_DESCRIPTORS[kind];
}
