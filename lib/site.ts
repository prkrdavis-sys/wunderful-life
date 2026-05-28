import siteData from "@/data/site.json";

export type SiteContent = typeof siteData;

export function getSiteContent(): SiteContent {
  return siteData;
}
