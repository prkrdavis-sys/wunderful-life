import { readSiteContent, updateSiteContent } from "@/lib/storage/site";
import { StorageError } from "@/lib/storage";

export async function getSiteContent() {
  return readSiteContent();
}

export type { SiteContent, AboutPhoto, HeroLink } from "@/lib/site/types";
