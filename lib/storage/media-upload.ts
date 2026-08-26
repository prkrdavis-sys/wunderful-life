export const MEDIA_UPLOAD_DIRS = [
  "videos",
  "thumbnails",
  "hero",
  "cta",
  "about-photos",
  "home-grid-photos",
  "brand-logos",
  "hero-photos",
] as const;

export type MediaUploadDir = (typeof MEDIA_UPLOAD_DIRS)[number];

export function isMediaUploadDir(value: string): value is MediaUploadDir {
  return MEDIA_UPLOAD_DIRS.includes(value as MediaUploadDir);
}
