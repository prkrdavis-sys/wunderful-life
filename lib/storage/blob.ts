export function getUseBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export const VIDEOS_METADATA_BLOB_PATH = "metadata/videos.json";

/** Vercel serverless functions reject request bodies larger than ~4.5MB. */
export const VERCEL_DIRECT_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;
