import type { SiteContent } from "@/lib/site/types";
import type { PhotoKind } from "@/lib/site/photo-slots";
import type { VideoSlot } from "@/lib/site/video-slots";

function omitImagePath<T extends { imagePath?: string }>(item: T): T {
  const next = { ...item };
  delete next.imagePath;
  return next;
}

function omitLogoPath<T extends { logoPath?: string }>(item: T): T {
  const next = { ...item };
  delete next.logoPath;
  return next;
}

/** Keep unsaved text edits; copy only the persisted hero/CTA media paths. */
export function mergeSlotVideo(
  draft: SiteContent,
  saved: SiteContent,
  slot: VideoSlot,
): SiteContent {
  if (slot === "hero") {
    return {
      ...draft,
      hero: {
        ...draft.hero,
        videoPath: saved.hero.videoPath,
        posterPath: saved.hero.posterPath,
      },
    };
  }

  return {
    ...draft,
    closingCta: {
      ...draft.closingCta,
      videoPath: saved.closingCta.videoPath,
      posterPath: saved.closingCta.posterPath,
    },
  };
}

/** Keep unsaved text edits; copy only the persisted image/logo for one row. */
export function mergePhotoMedia(
  draft: SiteContent,
  saved: SiteContent,
  kind: PhotoKind,
  id: string,
): SiteContent {
  switch (kind) {
    case "about": {
      const savedPhoto = saved.about.photos.find((photo) => photo.id === id);
      return {
        ...draft,
        about: {
          ...draft.about,
          photos: draft.about.photos.map((photo) => {
            if (photo.id !== id) return photo;
            if (!savedPhoto?.imagePath) return omitImagePath(photo);
            return { ...photo, imagePath: savedPhoto.imagePath };
          }),
        },
      };
    }
    case "collage": {
      const savedPhoto = saved.photography.photos.find((photo) => photo.id === id);
      return {
        ...draft,
        photography: {
          ...draft.photography,
          photos: draft.photography.photos.map((photo) => {
            if (photo.id !== id) return photo;
            if (!savedPhoto?.imagePath) return omitImagePath(photo);
            return { ...photo, imagePath: savedPhoto.imagePath };
          }),
        },
      };
    }
    case "brandLogo": {
      const savedBrand = saved.brands.items.find((brand) => brand.id === id);
      return {
        ...draft,
        brands: {
          ...draft.brands,
          items: draft.brands.items.map((brand) => {
            if (brand.id !== id) return brand;
            if (!savedBrand?.logoPath) return omitLogoPath(brand);
            return { ...brand, logoPath: savedBrand.logoPath };
          }),
        },
      };
    }
    case "heroCreator": {
      const hero = { ...draft.hero };
      if (saved.hero.creatorImagePath) {
        hero.creatorImagePath = saved.hero.creatorImagePath;
      } else {
        delete hero.creatorImagePath;
      }
      return { ...draft, hero };
    }
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
