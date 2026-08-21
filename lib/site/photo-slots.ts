import type { MediaUploadDir } from "@/lib/storage/media-upload";

export const PHOTO_KINDS = ["about", "collage", "brandLogo"] as const;
export type PhotoKind = (typeof PHOTO_KINDS)[number];

export type PhotoKindDescriptor = {
  kind: PhotoKind;
  endpoint: string;
  folder: MediaUploadDir;
  noun: string;
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
};

export function photoKindDescriptor(kind: PhotoKind): PhotoKindDescriptor {
  return PHOTO_KIND_DESCRIPTORS[kind];
}
