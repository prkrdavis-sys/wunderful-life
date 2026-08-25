import type { MediaUploadDir } from "@/lib/storage/media-upload";
import type { VideoUploadProfile } from "@/lib/videos/profile";

export const VIDEO_SLOTS = ["hero", "cta"] as const;
export type VideoSlot = (typeof VIDEO_SLOTS)[number];

export type VideoSlotDescriptor = {
  slot: VideoSlot;
  noun: string;
  endpoint: string;
  hint: string;
  profile: VideoUploadProfile;
  persistPoster: boolean;
  dir: MediaUploadDir;
};

export const VIDEO_SLOT_DESCRIPTORS: Record<VideoSlot, VideoSlotDescriptor> = {
  hero: {
    slot: "hero",
    noun: "hero video",
    endpoint: "/api/site/videos/hero",
    hint: "Upload the original 1080p or 4K clip from Photos — not a compressed copy. Portrait or landscape is fine; it is cropped to fill the hero, never stretched wide.",
    profile: "hero",
    persistPoster: true,
    dir: "hero",
  },
  cta: {
    slot: "cta",
    noun: "CTA video",
    endpoint: "/api/site/videos/cta",
    hint: "Upload the original 1080p or 4K clip from Photos — not a compressed copy. A vertical or 4:5 clip fills this frame without stretching.",
    profile: "cta",
    persistPoster: true,
    dir: "cta",
  },
};

export function isVideoSlot(value: string): value is VideoSlot {
  return VIDEO_SLOTS.includes(value as VideoSlot);
}

export function videoSlotDescriptor(slot: VideoSlot): VideoSlotDescriptor {
  return VIDEO_SLOT_DESCRIPTORS[slot];
}
