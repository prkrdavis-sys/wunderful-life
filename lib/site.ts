import { unstable_noStore as noStore } from "next/cache";
import { readSiteContent } from "@/lib/storage/site";

export async function getSiteContent() {
  noStore();
  return readSiteContent();
}

export type { SiteContent, AboutPhoto, GridPhoto, HeroLink } from "@/lib/site/types";
