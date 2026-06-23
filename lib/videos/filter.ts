import type { Platform, PortfolioVideo } from "./types";

export type VideoFilters = {
  platform?: Platform | "all";
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
    return true;
  });
}
