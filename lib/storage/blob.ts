/** Read env at request time — avoids Next.js inlining missing build-time vars as undefined. */
function readEnv(name: string): string | undefined {
  return process.env[name];
}

export function getUseBlobStorage(): boolean {
  return Boolean(readEnv("BLOB_READ_WRITE_TOKEN"));
}

export function getBlobReadWriteToken(): string | undefined {
  return readEnv("BLOB_READ_WRITE_TOKEN");
}

export const VIDEOS_METADATA_BLOB_PATH = "metadata/videos.json";
export const SITE_METADATA_BLOB_PATH = "metadata/site.json";

export function isVercelBlobUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  try {
    return new URL(value).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Vercel serverless functions reject request bodies larger than ~4.5MB. */
export const VERCEL_DIRECT_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;
