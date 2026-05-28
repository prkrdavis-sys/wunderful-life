export type Platform = "instagram" | "tiktok" | "youtube" | "other";

export type VideoMetadata = {
  title: string;
  brand: string;
  platform: Platform;
  hook: string;
  cta: string;
  durationSec: number;
  tags: string[];
  featured: boolean;
  sortOrder: number;
  slug: string;
};

export type VideoCreateInput = VideoMetadata;

export type VideoUpdateInput = Partial<VideoMetadata>;

export type PortfolioVideo = VideoMetadata & {
  id: string;
  thumbnailPath: string;
  videoPath: string;
  createdAt: string;
};

export const PLATFORMS: Platform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "other",
];

export function parsePlatform(value: string | null | undefined): Platform {
  if (value && PLATFORMS.includes(value as Platform)) {
    return value as Platform;
  }
  return "other";
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

export function platformLabel(platform: Platform): string {
  switch (platform) {
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
    case "other":
      return "Other";
  }
}
