import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  PUBLIC_REVALIDATE_SECONDS,
  SITE_CACHE_TAG,
} from "@/lib/cache/public";
import { hasSiteDatabaseConfig } from "@/lib/storage/database";
import { isHostedProduction, type ContentStoreSource } from "@/lib/storage/runtime";
import {
  readBundledSiteRecord,
  readSiteRecord,
} from "@/lib/storage/site";
import type { StoredSiteContent } from "@/lib/storage/database";

export type PublicSiteRecord = StoredSiteContent & {
  source: ContentStoreSource;
};

const loadCachedSiteRecord = unstable_cache(
  async () => readSiteRecord(),
  ["site-record"],
  {
    tags: [SITE_CACHE_TAG],
    revalidate: PUBLIC_REVALIDATE_SECONDS,
  },
);

function withSource(record: StoredSiteContent): PublicSiteRecord {
  return {
    ...record,
    source: hasSiteDatabaseConfig() ? "database" : "local-file",
  };
}

export const getSiteContentRecord = cache(async function getSiteContentRecord() {
  try {
    return withSource(await loadCachedSiteRecord());
  } catch (error) {
    if (isHostedProduction()) {
      console.error("Site content store unavailable.", error);
      throw error;
    }
    console.error(
      "Site content store unavailable; serving local files.",
      error,
    );
    return {
      ...(await readBundledSiteRecord()),
      source: "local-file" as const,
    };
  }
});

export const getSiteContent = cache(async function getSiteContent() {
  return (await getSiteContentRecord()).content;
});

export type { SiteContent, AboutPhoto, GridPhoto, HeroLink } from "@/lib/site/types";
