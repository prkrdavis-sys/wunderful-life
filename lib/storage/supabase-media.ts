import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isMediaUploadDir, type MediaUploadDir } from "./media-upload";
import { StorageError } from "./types";

const MEDIA_BUCKET = "site-media";

function readEnv(name: string): string | undefined {
  return process.env[name];
}

function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/rest\/v1$/i, "");
}

export function hasSupabaseMediaConfig(): boolean {
  return Boolean(
    readEnv("SUPABASE_URL") && readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

function getMediaStorage(): SupabaseClient {
  const rawUrl = readEnv("SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!rawUrl || !serviceRoleKey) {
    throw new StorageError(
      "Media storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      503,
    );
  }

  return createClient(normalizeSupabaseUrl(rawUrl), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function extensionFromFilename(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  const ext = filename.slice(dotIndex).toLowerCase();
  if (!/^\.[a-z0-9]{1,8}$/.test(ext)) return "";
  return ext;
}

function defaultExtensionForDir(dir: MediaUploadDir): string {
  switch (dir) {
    case "videos":
    case "hero":
    case "cta":
      return ".mp4";
    case "thumbnails":
    case "about-photos":
    case "home-grid-photos":
    case "brand-logos":
      return ".jpg";
    default: {
      const _exhaustive: never = dir;
      return _exhaustive;
    }
  }
}

export async function createSignedPublicMediaUpload(
  dir: MediaUploadDir,
  originalName: string,
): Promise<{ uploadUrl: string; publicUrl: string; path: string }> {
  if (!isMediaUploadDir(dir)) {
    throw new StorageError("That upload folder is not allowed.", 400);
  }

  const ext = extensionFromFilename(originalName) || defaultExtensionForDir(dir);
  const pathname = `${dir}/${randomUUID()}${ext}`;
  const storage = getMediaStorage().storage.from(MEDIA_BUCKET);
  const { data, error } = await storage.createSignedUploadUrl(pathname);

  if (error || !data?.signedUrl) {
    throw new StorageError(
      `Could not start media upload: ${error?.message ?? "unknown error"}`,
      503,
    );
  }

  return {
    uploadUrl: data.signedUrl,
    publicUrl: storage.getPublicUrl(pathname).data.publicUrl,
    path: pathname,
  };
}

export async function uploadPublicMedia(
  pathname: string,
  file: File,
  contentType?: string,
): Promise<string> {
  const storage = getMediaStorage().storage.from(MEDIA_BUCKET);
  const { error } = await storage.upload(pathname, file, {
    cacheControl: "31536000",
    contentType: contentType || file.type || undefined,
    upsert: false,
  });

  if (error) {
    throw new StorageError(`Could not upload media: ${error.message}`, 503);
  }

  return storage.getPublicUrl(pathname).data.publicUrl;
}

function storedPathFromPublicUrl(value: string): string | null {
  const rawUrl = readEnv("SUPABASE_URL");
  if (!rawUrl) return null;

  try {
    const storageUrl = new URL(normalizeSupabaseUrl(rawUrl));
    const mediaUrl = new URL(value);
    const prefix = `/storage/v1/object/public/${MEDIA_BUCKET}/`;

    if (
      mediaUrl.origin !== storageUrl.origin ||
      !mediaUrl.pathname.startsWith(prefix)
    ) {
      return null;
    }

    return decodeURIComponent(mediaUrl.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

export async function deletePublicMedia(value: string): Promise<void> {
  const pathname = storedPathFromPublicUrl(value);
  if (!pathname || !hasSupabaseMediaConfig()) return;

  const { error } = await getMediaStorage()
    .storage.from(MEDIA_BUCKET)
    .remove([pathname]);

  if (error) {
    throw new StorageError(`Could not delete media: ${error.message}`, 503);
  }
}
