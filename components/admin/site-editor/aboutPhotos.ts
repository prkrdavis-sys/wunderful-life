import type { AboutPhoto, SiteContent } from "@/lib/site/types";

export function withAboutPhoto(
  site: SiteContent,
  index: number,
  patch: Partial<Pick<AboutPhoto, "caption" | "rotate">>,
): SiteContent {
  const current = site.about.photos[index];
  if (!current) return site;
  const photos = [...site.about.photos];
  photos[index] = { ...current, ...patch };
  return {
    ...site,
    about: { ...site.about, photos },
  };
}
