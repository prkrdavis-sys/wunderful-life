import { unstable_noStore as noStore } from "next/cache";
import { getVideoBySlug, listVideos } from "@/lib/storage";

export async function getVideos() {
  noStore();
  return listVideos();
}

export async function getVideo(slug: string) {
  noStore();
  return getVideoBySlug(slug);
}
