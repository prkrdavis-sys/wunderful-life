import type { Platform, VideoCreateInput, VideoUpdateInput } from "./types";
import { parsePlatform, PLATFORMS } from "./types";

export type UploadFiles = {
  video?: File | null;
  thumbnail?: File | null;
};

function parseTags(
  value: FormDataEntryValue | null,
  mode: "create" | "update",
): string[] | undefined {
  if (mode === "update" && value === null) return undefined;
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
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
    video: form.get("video") instanceof File ? (form.get("video") as File) : null,
    thumbnail:
      form.get("thumbnail") instanceof File
        ? (form.get("thumbnail") as File)
        : null,
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
    tags: parseTags(form.get("tags"), "create") ?? [],
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
    tags: parseTags(form.get("tags"), "update"),
    featured: form.has("featured")
      ? parseBoolean(form.get("featured"))
      : undefined,
    slug: form.has("slug") ? String(form.get("slug")) : undefined,
  };
}
