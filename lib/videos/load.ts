import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  PUBLIC_REVALIDATE_SECONDS,
  VIDEOS_CACHE_TAG,
} from "@/lib/cache/public";
import { isHostedProduction } from "@/lib/storage/runtime";
import { listVideos, readBundledPortfolioVideos } from "@/lib/storage/local";

const loadCachedVideos = unstable_cache(
  async () => listVideos(),
  ["portfolio-videos"],
  {
    tags: [VIDEOS_CACHE_TAG],
    revalidate: PUBLIC_REVALIDATE_SECONDS,
  },
);

export const getVideos = cache(async function getVideos() {
  try {
    return await loadCachedVideos();
  } catch (error) {
    if (isHostedProduction()) {
      console.error("Video library store unavailable.", error);
      throw error;
    }
    console.error(
      "Video library store unavailable; serving local files.",
      error,
    );
    return readBundledPortfolioVideos();
  }
});

export const getVideo = cache(async function getVideo(slug: string) {
  const videos = await getVideos();
  return videos.find((video) => video.slug === slug) ?? null;
});
