import { extensionFromFilename } from "@/lib/files";

const ACCEPTED_VIDEO_EXTENSIONS = [".mov", ".mp4", ".m4v", ".webm"] as const;

const ACCEPTED_VIDEO_MIME_TYPES = [
  "video/quicktime",
  "video/mp4",
  "video/webm",
  "video/x-m4v",
] as const;

type AcceptedVideoExtension = (typeof ACCEPTED_VIDEO_EXTENSIONS)[number];
type AcceptedVideoMimeType = (typeof ACCEPTED_VIDEO_MIME_TYPES)[number];

function isAcceptedExtension(ext: string): ext is AcceptedVideoExtension {
  return ACCEPTED_VIDEO_EXTENSIONS.includes(ext as AcceptedVideoExtension);
}

function isAcceptedMimeType(mime: string): mime is AcceptedVideoMimeType {
  return ACCEPTED_VIDEO_MIME_TYPES.includes(mime as AcceptedVideoMimeType);
}

export const VIDEO_FILE_ACCEPT = [
  ...ACCEPTED_VIDEO_MIME_TYPES,
  ...ACCEPTED_VIDEO_EXTENSIONS,
  ...ACCEPTED_VIDEO_EXTENSIONS.map((ext) => ext.toUpperCase()),
].join(",");

export const VIDEO_UPLOAD_HELP =
  "MP4, MOV, and M4V supported, including clips up to two minutes. Files already under 50MB upload as-is; larger originals are compressed in the browser.";

/** After compression, keep clips under this size so storage and playback stay cheap. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function videoUploadErrorMessage(): string {
  return "Please upload an MP4, MOV, M4V, or WebM video (Apple Photos and iPhone videos are supported).";
}

export function isAcceptedVideoFile(file: Pick<File, "name" | "type">): boolean {
  const ext = extensionFromFilename(file.name);
  if (isAcceptedExtension(ext)) {
    return true;
  }

  const mime = file.type.toLowerCase();
  if (!mime || mime === "application/octet-stream") {
    return false;
  }

  return isAcceptedMimeType(mime);
}

export const BLOB_VIDEO_CONTENT_TYPES = [...ACCEPTED_VIDEO_MIME_TYPES];

export const BLOB_THUMBNAIL_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

export function videoContentTypeFromFilename(filename: string): string | undefined {
  switch (extensionFromFilename(filename)) {
    case ".mov":
      return "video/quicktime";
    case ".mp4":
      return "video/mp4";
    case ".m4v":
      return "video/x-m4v";
    case ".webm":
      return "video/webm";
    default:
      return undefined;
  }
}

/** MIME type for a stored video path or URL, used by <link rel="preload">. */
export function videoContentTypeFromPath(path: string): string {
  const pathname = path.split("?")[0]?.split("#")[0] ?? path;
  return videoContentTypeFromFilename(pathname) ?? "video/mp4";
}

/** Chrome stalls hard on document-preloaded QuickTime; keep the poster instead. */
export function isQuickTimeVideoPath(path: string): boolean {
  return videoContentTypeFromPath(path) === "video/quicktime";
}

export function uploadFilename(
  dir: "videos" | "thumbnails",
  originalName: string,
  id: string,
): string {
  const ext =
    extensionFromFilename(originalName) || (dir === "videos" ? ".mp4" : ".jpg");
  return `${dir}/${id}${ext}`;
}
