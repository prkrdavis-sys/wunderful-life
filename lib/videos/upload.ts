const ACCEPTED_VIDEO_EXTENSIONS = [".mov", ".mp4", ".m4v", ".webm"] as const;

const ACCEPTED_VIDEO_MIME_TYPES = [
  "video/quicktime",
  "video/mp4",
  "video/webm",
  "video/x-m4v",
] as const;

type AcceptedVideoExtension = (typeof ACCEPTED_VIDEO_EXTENSIONS)[number];
type AcceptedVideoMimeType = (typeof ACCEPTED_VIDEO_MIME_TYPES)[number];

function extensionFromFilename(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return filename.slice(dotIndex).toLowerCase();
}

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
  "MP4, MOV, and M4V supported — including videos exported from Apple Photos and iPhone.";

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
