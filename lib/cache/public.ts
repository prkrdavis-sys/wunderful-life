import { revalidatePath, revalidateTag } from "next/cache";

export const SITE_CACHE_TAG = "site-content";
export const VIDEOS_CACHE_TAG = "portfolio-videos";

/** ISR window for public pages. Admin saves purge immediately via tags/paths. */
export const PUBLIC_REVALIDATE_SECONDS = 60;

export function revalidatePublicContent(slug?: string) {
  revalidateTag(SITE_CACHE_TAG, "max");
  revalidateTag(VIDEOS_CACHE_TAG, "max");
  revalidatePath("/", "layout");
  revalidatePath("/work");
  if (slug) {
    revalidatePath(`/work/${slug}`);
  }
}
