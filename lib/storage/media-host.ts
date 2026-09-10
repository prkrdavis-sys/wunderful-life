import type { MediaUploadDir } from "./media-upload";
import {
  createSignedR2Upload,
  deleteFromR2,
  hasR2MediaConfig,
  r2KeyFromPublicUrl,
  uploadToR2,
} from "./r2-media";
import {
  createSignedPublicMediaUpload,
  deletePublicMedia as deleteSupabaseMedia,
  hasSupabaseMediaConfig,
  uploadPublicMedia as uploadSupabaseMedia,
} from "./supabase-media";

/**
 * Chooses where new media is written. R2 wins when configured because its
 * egress is free; Supabase Storage remains the fallback and keeps serving every
 * file uploaded before the switch, so no existing URL ever breaks.
 */

export function hasMediaConfig(): boolean {
  return hasR2MediaConfig() || hasSupabaseMediaConfig();
}

export function activeMediaHost(): "r2" | "supabase" | "none" {
  if (hasR2MediaConfig()) return "r2";
  if (hasSupabaseMediaConfig()) return "supabase";
  return "none";
}

/**
 * Supabase signed uploads expect a multipart form; R2 presigned PUTs expect the
 * raw bytes plus the exact headers that were signed. The browser follows
 * whichever mode the server hands back.
 */
export type SignedMediaUpload = {
  uploadUrl: string;
  publicUrl: string;
  path: string;
  mode: "supabase-form" | "raw-put";
  headers?: Record<string, string>;
};

export async function createSignedMediaUpload(
  dir: MediaUploadDir,
  originalName: string,
  contentType?: string,
): Promise<SignedMediaUpload> {
  if (hasR2MediaConfig()) {
    return createSignedR2Upload(dir, originalName, contentType);
  }
  return {
    ...(await createSignedPublicMediaUpload(dir, originalName)),
    mode: "supabase-form",
  };
}

export async function uploadMedia(
  pathname: string,
  file: File,
  contentType?: string,
): Promise<string> {
  if (hasR2MediaConfig()) {
    return uploadToR2(pathname, file, contentType);
  }
  return uploadSupabaseMedia(pathname, file, contentType);
}

/** Routes deletes by URL so pre-migration Supabase files stay reachable. */
export async function deleteMedia(value: string): Promise<void> {
  if (hasR2MediaConfig() && r2KeyFromPublicUrl(value)) {
    await deleteFromR2(value);
    return;
  }
  if (hasSupabaseMediaConfig()) {
    await deleteSupabaseMedia(value);
  }
}
