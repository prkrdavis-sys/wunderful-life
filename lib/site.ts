import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  PUBLIC_REVALIDATE_SECONDS,
  SITE_CACHE_TAG,
} from "@/lib/cache/public";
import {
  readBundledSiteRecord,
  readSiteRecord,
} from "@/lib/storage/site";

const loadCachedSiteRecord = unstable_cache(
  async () => readSiteRecord(),
  ["site-record"],
  {
    tags: [SITE_CACHE_TAG],
    revalidate: PUBLIC_REVALIDATE_SECONDS,
  },
);

export const getSiteContentRecord = cache(async function getSiteContentRecord() {
  try {
    return await loadCachedSiteRecord();
  } catch (error) {
    console.error(
      "Site content store unavailable; serving bundled fallback.",
      error,
    );
    return readBundledSiteRecord();
  }
});

export const getSiteContent = cache(async function getSiteContent() {
  return (await getSiteContentRecord()).content;
});

export type { SiteContent, AboutPhoto, GridPhoto, HeroLink } from "@/lib/site/types";
