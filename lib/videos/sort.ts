import type { PortfolioVideo } from "./types";

export function sortVideos(videos: PortfolioVideo[]): PortfolioVideo[] {
  return [...videos].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function reorderVideos(
  videos: PortfolioVideo[],
  orderedIds: string[],
): PortfolioVideo[] {
  const byId = new Map(videos.map((video) => [video.id, video]));

  return orderedIds
    .map((id, index) => {
      const video = byId.get(id);
      if (!video) return null;
      return { ...video, sortOrder: index };
    })
    .filter((video): video is PortfolioVideo => video !== null);
}
