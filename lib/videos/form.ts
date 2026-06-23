import type { Platform, VideoCreateInput, VideoUpdateInput } from "./types";
import { parsePlatform, PLATFORMS } from "./types";

export type UploadFiles = {
  video?: File | null;
  thumbnail?: File | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
};

function getFileEntry(form: FormData, key: string): File | null {
  const value = form.get(key);
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

function getUrlEntry(form: FormData, key: string): string | null {
  const value = form.get(key);
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseOptionalPlatform(
  value: FormDataEntryValue | null,
): Platform | undefined {
  if (value === null) return undefined;
  const platform = String(value);
  if (PLATFORMS.includes(platform as Platform)) {
    return platform as Platform;
  }
  return undefined;
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

export function parseUploadFiles(form: FormData): UploadFiles {
  return {
    video: getFileEntry(form, "video"),
    thumbnail: getFileEntry(form, "thumbnail"),
    videoUrl: getUrlEntry(form, "videoUrl"),
    thumbnailUrl: getUrlEntry(form, "thumbnailUrl"),
  };
}

export function parseCreateVideoForm(form: FormData): VideoCreateInput {
  return {
    title: String(form.get("title") ?? ""),
    brand: String(form.get("brand") ?? ""),
    platform: parsePlatform(String(form.get("platform") ?? "")),
    hook: String(form.get("hook") ?? ""),
    cta: String(form.get("cta") ?? ""),
    durationSec: Number(form.get("durationSec") ?? 0),
    tags: [],
    featured: parseBoolean(form.get("featured")),
    sortOrder: Number(form.get("sortOrder") ?? 999),
    slug: String(form.get("slug") ?? ""),
  };
}

export function parseUpdateVideoForm(form: FormData): VideoUpdateInput {
  return {
    title: form.has("title") ? String(form.get("title")) : undefined,
    brand: form.has("brand") ? String(form.get("brand")) : undefined,
    platform: parseOptionalPlatform(form.get("platform")),
    hook: form.has("hook") ? String(form.get("hook")) : undefined,
    cta: form.has("cta") ? String(form.get("cta")) : undefined,
    durationSec: form.has("durationSec")
      ? Number(form.get("durationSec"))
      : undefined,
    tags: [],
    featured: form.has("featured")
      ? parseBoolean(form.get("featured"))
      : undefined,
    slug: form.has("slug") ? String(form.get("slug")) : undefined,
  };
}
