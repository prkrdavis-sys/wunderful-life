import { unstable_noStore as noStore } from "next/cache";
import { readSiteContent, readSiteRecord } from "@/lib/storage/site";

export async function getSiteContent() {
  noStore();
  return readSiteContent();
}

export async function getSiteContentRecord() {
  noStore();
  return readSiteRecord();
}

export type { SiteContent, AboutPhoto, GridPhoto, HeroLink } from "@/lib/site/types";
