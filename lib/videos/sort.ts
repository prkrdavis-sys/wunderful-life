import type { PortfolioVideo } from "./types";

export function sortVideos(videos: PortfolioVideo[]): PortfolioVideo[] {
  return [...videos].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function uniqueVideosById(videos: PortfolioVideo[]): PortfolioVideo[] {
  const seen = new Set<string>();
  return videos.filter((video) => {
    if (seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  });
}

export function reorderVideos(
  videos: PortfolioVideo[],
  orderedIds: string[],
): PortfolioVideo[] {
  const byId = new Map(videos.map((video) => [video.id, video]));
  const seen = new Set<string>();

  const ordered = orderedIds.flatMap((id) => {
    const video = byId.get(id);
    if (!video || seen.has(id)) return [];
    seen.add(id);
    return [video];
  });

  // Keep any videos missing from the payload instead of dropping them.
  for (const video of videos) {
    if (!seen.has(video.id)) {
      ordered.push(video);
      seen.add(video.id);
    }
  }

  return ordered.map((video, index) => ({ ...video, sortOrder: index }));
}
