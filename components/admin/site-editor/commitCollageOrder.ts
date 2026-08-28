import type { Dispatch, SetStateAction } from "react";
import { toErrorMessage } from "@/lib/errors";
import { readResponseJson } from "@/lib/http/json";
import {
  siteUpdatedAtFromResponse,
  siteVersionFromResponse,
} from "@/lib/site/response";
import type { CollagePhoto, SiteContent } from "@/lib/site/types";

export function withPhotographyPhotos(
  site: SiteContent,
  photos: CollagePhoto[],
): SiteContent {
  return {
    ...site,
    photography: { ...site.photography, photos },
  };
}

export function sameIdSequence(
  left: readonly { id: string }[],
  right: readonly { id: string }[],
): boolean {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id);
}

function savedIdsInOrder(
  photos: CollagePhoto[],
  savedIds: Set<string>,
): string[] {
  return photos.filter((photo) => savedIds.has(photo.id)).map((photo) => photo.id);
}

function orderSavedPhotos(
  photos: CollagePhoto[],
  orderedSavedIds: string[],
): CollagePhoto[] {
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const seen = new Set<string>();
  const ordered: CollagePhoto[] = [];

  for (const id of orderedSavedIds) {
    const photo = byId.get(id);
    if (!photo || seen.has(id)) continue;
    seen.add(id);
    ordered.push(photo);
  }

  for (const photo of photos) {
    if (seen.has(photo.id)) continue;
    seen.add(photo.id);
    ordered.push(photo);
  }

  return ordered;
}

/** Keep draft alt/shape; follow the dragged id order. */
export function alignFormPhotos(
  formPhotos: CollagePhoto[],
  nextPhotos: CollagePhoto[],
): CollagePhoto[] {
  const byId = new Map(formPhotos.map((photo) => [photo.id, photo]));
  const seen = new Set<string>();
  const ordered: CollagePhoto[] = [];

  for (const photo of nextPhotos) {
    const draft = byId.get(photo.id) ?? photo;
    if (seen.has(draft.id)) continue;
    seen.add(draft.id);
    ordered.push(draft);
  }

  for (const photo of formPhotos) {
    if (seen.has(photo.id)) continue;
    seen.add(photo.id);
    ordered.push(photo);
  }

  return ordered;
}

type CommitCollageOrderArgs = {
  nextPhotos: CollagePhoto[];
  currentSite: SiteContent;
  savedIds: Set<string>;
  siteVersion: number;
  setSite: Dispatch<SetStateAction<SiteContent>>;
  setSiteVersion: (version: number) => void;
  setSiteUpdatedAt: (updatedAt: string) => void;
  setForm?: Dispatch<SetStateAction<SiteContent>>;
};

export async function commitCollageOrder({
  nextPhotos,
  currentSite,
  savedIds,
  siteVersion,
  setSite,
  setSiteVersion,
  setSiteUpdatedAt,
  setForm,
}: CommitCollageOrderArgs): Promise<void> {
  const orderedSavedIds = savedIdsInOrder(nextPhotos, savedIds);
  const previousSavedPhotos = currentSite.photography.photos;
  const nextSitePhotos = orderSavedPhotos(previousSavedPhotos, orderedSavedIds);
  const savedOrderChanged = !sameIdSequence(previousSavedPhotos, nextSitePhotos);

  let previousFormPhotos: CollagePhoto[] | undefined;

  setSite(withPhotographyPhotos(currentSite, nextSitePhotos));

  if (setForm) {
    setForm((current) => {
      previousFormPhotos = current.photography.photos;
      return withPhotographyPhotos(
        current,
        alignFormPhotos(current.photography.photos, nextPhotos),
      );
    });
  }

  if (!savedOrderChanged) return;

  try {
    const response = await fetch("/api/site/collage-photos/reorder", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Site-Version": String(siteVersion),
      },
      body: JSON.stringify({ orderedIds: orderedSavedIds }),
    });
    const data = await readResponseJson<SiteContent & { error?: string }>(
      response,
    );

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to reorder photos.");
    }

    setSite(data);
    setSiteVersion(siteVersionFromResponse(response));
    const updatedAt = siteUpdatedAtFromResponse(response);
    if (updatedAt) setSiteUpdatedAt(updatedAt);
  } catch (error) {
    setSite(currentSite);
    if (setForm && previousFormPhotos) {
      const rolledBack = previousFormPhotos;
      setForm((current) => withPhotographyPhotos(current, rolledBack));
    }
    throw new Error(toErrorMessage(error, "Failed to reorder photos."));
  }
}
