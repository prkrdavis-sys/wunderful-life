import { extensionFromFilename } from "@/lib/files";

const ACCEPTED_PHOTO_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
] as const;

const WEB_SAFE_PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;

/** Max edge length when re-encoding iPhone / large camera photos for the web. */
const MAX_PHOTO_EDGE = 1920;
const COMPRESS_PHOTO_OVER_BYTES = 300_000;
/**
 * Hard ceiling for any stored still. PNGs used to skip compression entirely,
 * which is how a 3.9MB hero cutout reached production and ate free egress.
 */
const ALWAYS_COMPRESS_OVER_BYTES = 600_000;

type PhotoFolder =
  | "about-photos"
  | "home-grid-photos"
  | "brand-logos"
  | "hero-photos"
  | "cta-photos"
  | "stats-photos";

function isHeicLike(file: Pick<File, "name" | "type">): boolean {
  const mime = file.type.toLowerCase();
  if (mime.includes("heic") || mime.includes("heif")) return true;
  const ext = extensionFromFilename(file.name);
  return ext === ".heic" || ext === ".heif";
}

function extensionForMime(mime: string): string {
  switch (mime.toLowerCase()) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    default:
      return ".jpg";
  }
}

function asciiPhotoName(file: Pick<File, "name" | "type">, id: string): string {
  const ext =
    extensionFromFilename(file.name) || extensionForMime(file.type || "image/jpeg");
  const safeExt = ACCEPTED_PHOTO_EXTENSIONS.includes(
    ext as (typeof ACCEPTED_PHOTO_EXTENSIONS)[number],
  )
    ? ext === ".jpeg"
      ? ".jpg"
      : ext
    : ".jpg";
  return `${id}${safeExt}`;
}

export function photoContentType(file: Pick<File, "name" | "type">): string {
  if (file.type && file.type.startsWith("image/")) return file.type;
  switch (extensionFromFilename(file.name)) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".heic":
      return "image/heic";
    case ".heif":
      return "image/heif";
    default:
      return "image/jpeg";
  }
}

export function photoBlobPathname(
  folder: PhotoFolder,
  id: string,
  file: Pick<File, "name" | "type">,
): string {
  return `${folder}/${asciiPhotoName(file, id)}`;
}

export function isWebSafePhoto(file: Pick<File, "name" | "type">): boolean {
  if (isHeicLike(file)) return false;
  const ext = extensionFromFilename(file.name);
  if (
    WEB_SAFE_PHOTO_EXTENSIONS.includes(
      ext as (typeof WEB_SAFE_PHOTO_EXTENSIONS)[number],
    )
  ) {
    return true;
  }
  const mime = file.type.toLowerCase();
  return (
    mime === "image/jpeg" ||
    mime === "image/png" ||
    mime === "image/webp" ||
    mime === "image/gif"
  );
}

async function canvasToEncodedFile(
  source: CanvasImageSource,
  width: number,
  height: number,
  id: string,
  mimeType: "image/jpeg" | "image/webp",
  quality = 0.8,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare this photo for upload.");
  }
  context.drawImage(source, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Could not convert this photo for upload."));
      },
      mimeType,
      quality,
    );
  });

  // Safari falls back to PNG when it cannot encode the requested type, which
  // would be larger than the original. Trust the blob's own type.
  const encodedType = blob.type || mimeType;
  return new File([blob], `${id}${extensionForMime(encodedType)}`, {
    type: encodedType,
  });
}

function scaledSize(
  width: number,
  height: number,
  maxEdge = MAX_PHOTO_EDGE,
): { width: number; height: number } {
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height };
  }
  const scale = Math.min(maxEdge / width, maxEdge / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * iPhone camera rolls often hand Safari HEIC (or huge JPEGs). Re-encode to a
 * web-safe JPEG with an ASCII filename so FormData + Blob uploads succeed.
 */
export async function preparePhotoForUpload(
  file: File,
  options?: {
    forceEncode?: boolean;
    maxEdge?: number;
    quality?: number;
    preferJpeg?: boolean;
  },
): Promise<File> {
  const id = `photo-${crypto.randomUUID()}`;
  const maxEdge = options?.maxEdge ?? MAX_PHOTO_EDGE;
  const quality = options?.quality ?? 0.8;
  const mime = file.type.toLowerCase();
  const preferJpeg = options?.preferJpeg ?? !mime.includes("png");
  // Re-encoding a GIF through canvas would flatten an animation, so leave it.
  const isGif = mime === "image/gif" || extensionFromFilename(file.name) === ".gif";
  const needsEncode =
    options?.forceEncode ||
    isHeicLike(file) ||
    !isWebSafePhoto(file) ||
    (preferJpeg && file.size > COMPRESS_PHOTO_OVER_BYTES) ||
    (!isGif && file.size > ALWAYS_COMPRESS_OVER_BYTES);
  // PNG cutouts (the hero portrait) and logos carry transparency that JPEG
  // would fill with black, so those compress to WebP instead.
  const targetMime =
    preferJpeg && !mime.includes("png") && !mime.includes("webp")
      ? ("image/jpeg" as const)
      : ("image/webp" as const);

  if (!needsEncode) {
    const name = asciiPhotoName(file, id);
    if (name === file.name && file.type) return file;
    return new File([file], name, {
      type: photoContentType(file),
      lastModified: file.lastModified,
    });
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = scaledSize(bitmap.width, bitmap.height, maxEdge);
    try {
      return await canvasToEncodedFile(
        bitmap,
        width,
        height,
        id,
        targetMime,
        quality,
      );
    } finally {
      bitmap.close();
    }
  } catch {
    // Fall through to HTMLImageElement for older Safari builds.
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(
          new Error(
            "This iPhone photo format isn’t supported for upload. In iPhone Settings → Camera → Formats, choose Most Compatible, then try again.",
          ),
        );
      element.src = objectUrl;
    });
    const { width, height } = scaledSize(image.naturalWidth, image.naturalHeight, maxEdge);
    return await canvasToEncodedFile(image, width, height, id, targetMime, quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

