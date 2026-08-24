import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { readSiteRecord } from "@/lib/storage/site";

export const getSiteContentRecord = cache(async function getSiteContentRecord() {
  noStore();
  return readSiteRecord();
});

export const getSiteContent = cache(async function getSiteContent() {
  return (await getSiteContentRecord()).content;
});

export type { SiteContent, AboutPhoto, GridPhoto, HeroLink } from "@/lib/site/types";
