export const MEDIA_UPLOAD_DIRS = [
  "videos",
  "thumbnails",
  "hero",
  "about-photos",
  "home-grid-photos",
  "brand-logos",
  "hero-photos",
  "cta-photos",
  "stats-photos",
] as const;

export type MediaUploadDir = (typeof MEDIA_UPLOAD_DIRS)[number];

export function isMediaUploadDir(value: string): value is MediaUploadDir {
  return MEDIA_UPLOAD_DIRS.includes(value as MediaUploadDir);
}

/** Fallback when the uploaded filename carries no usable extension. */
export function defaultExtensionForDir(dir: MediaUploadDir): string {
  switch (dir) {
    case "videos":
    case "hero":
      return ".mp4";
    case "thumbnails":
    case "about-photos":
    case "home-grid-photos":
    case "brand-logos":
    case "cta-photos":
    case "stats-photos":
      return ".jpg";
    case "hero-photos":
      return ".png";
    default: {
      const _exhaustive: never = dir;
      return _exhaustive;
    }
  }
}
