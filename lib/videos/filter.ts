import type { Platform, PortfolioVideo } from "./types";

export type VideoFilters = {
  platform?: Platform | "all";
  tag?: string | "all";
  featured?: boolean;
};

export function filterVideos(
  videos: PortfolioVideo[],
  filters: VideoFilters,
): PortfolioVideo[] {
  return videos.filter((video) => {
    if (filters.featured !== undefined && video.featured !== filters.featured) {
      return false;
    }
    if (filters.platform && filters.platform !== "all" && video.platform !== filters.platform) {
      return false;
    }
    if (filters.tag && filters.tag !== "all" && !video.tags.includes(filters.tag)) {
      return false;
    }
    return true;
  });
}

export function collectTags(videos: PortfolioVideo[]): string[] {
  const tags = new Set<string>();
  for (const video of videos) {
    for (const tag of video.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}
