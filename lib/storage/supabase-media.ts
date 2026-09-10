import { randomUUID } from "crypto";
import { extensionFromFilename } from "@/lib/files";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminConfig,
  normalizeSupabaseUrl,
} from "./supabase-admin";
import { withSupabaseJwtClockSkewRetry } from "./supabase-retry";
import {
  defaultExtensionForDir,
  isMediaUploadDir,
  type MediaUploadDir,
} from "./media-upload";
import { StorageError } from "./types";

const MEDIA_BUCKET = "site-media";

export function hasSupabaseMediaConfig(): boolean {
  return hasSupabaseAdminConfig();
}

function getMediaStorage(): SupabaseClient {
  return createSupabaseAdminClient(
    "Media storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

async function withMediaStorage<T>(run: (storage: SupabaseClient) => Promise<T>): Promise<T> {
  return withSupabaseJwtClockSkewRetry(async () => run(getMediaStorage()));
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

  return withMediaStorage(async (client) => {
    const storage = client.storage.from(MEDIA_BUCKET);
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
  });
}

export async function uploadPublicMedia(
  pathname: string,
  file: File,
  contentType?: string,
): Promise<string> {
  return withMediaStorage(async (client) => {
    const storage = client.storage.from(MEDIA_BUCKET);
    const { error } = await storage.upload(pathname, file, {
      cacheControl: "31536000",
      contentType: contentType || file.type || undefined,
      upsert: false,
    });

    if (error) {
      throw new StorageError(`Could not upload media: ${error.message}`, 503);
    }

    return storage.getPublicUrl(pathname).data.publicUrl;
  });
}

function storedPathFromPublicUrl(value: string): string | null {
  const rawUrl = process.env.SUPABASE_URL?.trim();
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

  await withMediaStorage(async (client) => {
    const { error } = await client.storage.from(MEDIA_BUCKET).remove([pathname]);

    if (error) {
      throw new StorageError(`Could not delete media: ${error.message}`, 503);
    }
  });
}
