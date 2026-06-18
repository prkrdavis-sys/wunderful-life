/** Read env at request time — avoids Next.js inlining missing build-time vars as undefined. */
function readEnv(name: string): string | undefined {
  return process.env[name];
}

export function getUseBlobStorage(): boolean {
  if (readEnv("BLOB_READ_WRITE_TOKEN")) {
    return true;
  }

  // Linked Blob stores inject the token at runtime on Vercel even when it was
  // absent during `next build` (which would otherwise bake in `undefined`).
  return readEnv("VERCEL") === "1";
}

export function getBlobReadWriteToken(): string | undefined {
  return readEnv("BLOB_READ_WRITE_TOKEN");
}

export const VIDEOS_METADATA_BLOB_PATH = "metadata/videos.json";
export const SITE_METADATA_BLOB_PATH = "metadata/site.json";

/** Vercel serverless functions reject request bodies larger than ~4.5MB. */
export const VERCEL_DIRECT_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;
