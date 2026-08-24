import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getVideoBySlug, listVideos } from "@/lib/storage";

export const getVideos = cache(async function getVideos() {
  noStore();
  return listVideos();
});

export const getVideo = cache(async function getVideo(slug: string) {
  noStore();
  return getVideoBySlug(slug);
});
