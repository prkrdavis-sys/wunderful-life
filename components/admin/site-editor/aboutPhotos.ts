import type { Dispatch, SetStateAction } from "react";
import type { AboutPhoto, SiteContent } from "@/lib/site/types";

export function withAboutPhoto(
  site: SiteContent,
  index: number,
  patch: Partial<Pick<AboutPhoto, "caption" | "showCaption" | "rotate" | "frame">>,
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

export function withCtaPhoto(
  site: SiteContent,
  patch: Partial<Pick<AboutPhoto, "caption" | "showCaption" | "rotate" | "frame">>,
): SiteContent {
  return {
    ...site,
    closingCta: {
      ...site.closingCta,
      photo: { ...site.closingCta.photo, ...patch },
    },
  };
}

export function withCtaShowPhoto(
  site: SiteContent,
  showPhoto: boolean,
): SiteContent {
  return {
    ...site,
    closingCta: { ...site.closingCta, showPhoto },
  };
}

export function withStatsBannerVisible(
  site: SiteContent,
  visible: boolean,
): SiteContent {
  return {
    ...site,
    statsBanner: { ...site.statsBanner, visible },
  };
}

export function withAboutPhotos(
  site: SiteContent,
  photos: AboutPhoto[],
): SiteContent {
  return {
    ...site,
    about: { ...site.about, photos },
  };
}

/** Keep the public page in sync with unsaved framed-photo edits. */
export function applyAboutSite(
  setForm: Dispatch<SetStateAction<SiteContent>>,
  setSite: Dispatch<SetStateAction<SiteContent>>,
  updater: (current: SiteContent) => SiteContent,
) {
  setForm(updater);
  setSite(updater);
}
