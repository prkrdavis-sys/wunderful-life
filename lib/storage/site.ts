import { del, get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { normalizeSiteContent } from "@/lib/site/normalize";
import type { SiteContent } from "@/lib/site/types";
import {
  getUseBlobStorage,
  SITE_METADATA_BLOB_PATH,
} from "./blob";
import {
  hasSiteDatabaseConfig,
  initializeStoredSiteContent,
  readStoredSiteContent,
  saveStoredSiteContent,
  type StoredSiteContent,
} from "./database";
import { StorageError } from "./types";

const SITE_PATH = path.join(process.cwd(), "data", "site.json");
const ABOUT_PHOTO_DIR = path.join(process.cwd(), "public", "about-photos");
/** Folder name kept from the old home grid so existing uploads still resolve. */
const COLLAGE_PHOTO_DIR = path.join(process.cwd(), "public", "home-grid-photos");
const BRAND_LOGO_DIR = path.join(process.cwd(), "public", "brand-logos");
const HERO_VIDEO_DIR = path.join(process.cwd(), "public", "uploads", "hero");
const CTA_VIDEO_DIR = path.join(process.cwd(), "public", "uploads", "cta");

function isCompleteSiteContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== "object") return false;
  const site = value as SiteContent;
  return (
    typeof site.fullName === "string" &&
    typeof site.name === "string" &&
    typeof site.brand === "string" &&
    typeof site.tagline === "string" &&
    Boolean(site.about?.headline) &&
    Array.isArray(site.about?.paragraphs) &&
    site.about.paragraphs.every((paragraph) => typeof paragraph === "string") &&
    Array.isArray(site.about?.photos) &&
    Array.isArray(site.heroLinks) &&
    Boolean(site.social?.instagram) &&
    Boolean(site.social?.email) &&
    Array.isArray(site.services) &&
    Array.isArray(site.statsBanner?.items) &&
    Boolean(site.work?.heading) &&
    Array.isArray(site.photography?.photos) &&
    Array.isArray(site.brands?.items) &&
    Array.isArray(site.ugcBenefits?.benefits) &&
    Boolean(site.closingCta?.headline)
  );
}

async function readSiteFromFile(): Promise<SiteContent> {
  const raw = await fs.readFile(SITE_PATH, "utf8");
  const parsed = JSON.parse(raw) as SiteContent;
  return normalizeSiteContent(parsed);
}

async function ensurePhotoDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readSiteFromBlob(): Promise<SiteContent | null> {
  if (!getUseBlobStorage()) return null;

  try {
    const result = await get(SITE_METADATA_BLOB_PATH, { access: "public" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text) as SiteContent;
    return isCompleteSiteContent(parsed) ? normalizeSiteContent(parsed) : null;
  } catch (error) {
    throw new StorageError(
      error instanceof Error && error.message
        ? `Could not load site content from Vercel Blob: ${error.message}`
        : "Could not load site content from Vercel Blob.",
      503,
    );
  }
}

async function readLegacySiteContent(): Promise<SiteContent> {
  const blobSite = await readSiteFromBlob();
  if (blobSite !== null) return blobSite;

  if (process.env.VERCEL === "1") {
    throw new StorageError(
      "Production site content is unavailable. Check the connected Blob store.",
      503,
    );
  }

  return readSiteFromFile();
}

export async function readSiteRecord(): Promise<StoredSiteContent> {
  if (hasSiteDatabaseConfig()) {
    const stored = await readStoredSiteContent();
    if (stored) {
      return {
        ...stored,
        content: normalizeSiteContent(stored.content),
      };
    }

    const legacy = await readLegacySiteContent();
    const initialized = await initializeStoredSiteContent(legacy);
    return {
      ...initialized,
      content: normalizeSiteContent(initialized.content),
    };
  }

  if (process.env.VERCEL === "1") {
    throw new StorageError(
      "Production site content storage is not configured. Add the transactional database credentials.",
      503,
    );
  }

  return {
    content: await readSiteFromFile(),
    version: 1,
    updatedAt: new Date(0).toISOString(),
  };
}

export async function readSiteContent(): Promise<SiteContent> {
  return (await readSiteRecord()).content;
}

export async function writeSiteContent(
  content: SiteContent,
  expectedVersion?: number,
): Promise<SiteContent> {
  if (!isCompleteSiteContent(content)) {
    throw new StorageError("Invalid site content.", 400);
  }

  const normalized = normalizeSiteContent(content);

  if (hasSiteDatabaseConfig()) {
    if (expectedVersion === undefined) {
      throw new StorageError("A site content version is required to save.", 409);
    }
    await saveStoredSiteContent(normalized, expectedVersion);
    return normalized;
  }

  const json = `${JSON.stringify(normalized, null, 2)}\n`;
  await fs.writeFile(SITE_PATH, json);
  return normalized;
}

export async function updateSiteContent(
  content: SiteContent,
  expectedVersion: number,
) {
  return writeSiteContent(normalizeSiteContent(content), expectedVersion);
}

async function deleteStoredPhoto(imagePath: string) {
  if (imagePath.startsWith("https://")) {
    if (getUseBlobStorage()) {
      try {
        await del(imagePath);
      } catch {
        // ignore missing blobs
      }
    }
    return;
  }

  if (
    imagePath.startsWith("/about-photos/") ||
    imagePath.startsWith("/home-grid-photos/") ||
    imagePath.startsWith("/brand-logos/") ||
    imagePath.startsWith("/uploads/photos/") ||
    imagePath.startsWith("/uploads/hero/") ||
    imagePath.startsWith("/uploads/cta/")
  ) {
    const absolute = path.join(process.cwd(), "public", imagePath);
    try {
      await fs.unlink(absolute);
    } catch {
      // ignore missing files
    }
  }
}

type PhotoFolder = "about-photos" | "home-grid-photos" | "brand-logos";

const PHOTO_DIRS: Record<PhotoFolder, string> = {
  "about-photos": ABOUT_PHOTO_DIR,
  "home-grid-photos": COLLAGE_PHOTO_DIR,
  "brand-logos": BRAND_LOGO_DIR,
};

function photoFileExtension(file: File): string {
  const fromName = path.extname(file.name).toLowerCase();
  if (
    fromName === ".jpg" ||
    fromName === ".jpeg" ||
    fromName === ".png" ||
    fromName === ".webp" ||
    fromName === ".gif"
  ) {
    return fromName === ".jpeg" ? ".jpg" : fromName;
  }

  switch (file.type.toLowerCase()) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

function photoContentType(file: File): string {
  if (file.type && file.type.startsWith("image/")) return file.type;
  switch (photoFileExtension(file)) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

async function savePhotoFile(
  photoId: string,
  file: File,
  folder: PhotoFolder,
): Promise<string> {
  const ext = photoFileExtension(file);
  const filename = `${photoId}-${randomUUID()}${ext}`;

  if (getUseBlobStorage()) {
    const blob = await put(`${folder}/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: photoContentType(file),
    });
    return blob.url;
  }

  await ensurePhotoDir(PHOTO_DIRS[folder]);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(PHOTO_DIRS[folder], filename), buffer);
  return `/${folder}/${filename}`;
}

async function setPhotoImagePath(
  photoId: string,
  imagePath: string,
  kind: "about" | "collage",
  expectedVersion?: number,
): Promise<SiteContent> {
  const record = await readSiteRecord();
  if (expectedVersion !== undefined && record.version !== expectedVersion) {
    await deleteStoredPhoto(imagePath);
    throw new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  const site = record.content;
  const photos =
    kind === "about" ? site.about.photos : site.photography.photos;
  const photoIndex = photos.findIndex((photo) => photo.id === photoId);

  if (photoIndex === -1) {
    await deleteStoredPhoto(imagePath);
    throw new StorageError("Photo not found.", 404);
  }

  const current = photos[photoIndex];
  photos[photoIndex] = { ...current, imagePath };
  try {
    await writeSiteContent(site, record.version);
  } catch (error) {
    if (imagePath !== current.imagePath) {
      await deleteStoredPhoto(imagePath);
    }
    throw error;
  }
  if (current.imagePath && current.imagePath !== imagePath) {
    await deleteStoredPhoto(current.imagePath);
  }
  return site;
}

export async function uploadAboutPhoto(
  photoId: string,
  file: File,
  expectedVersion?: number,
) {
  const imagePath = await savePhotoFile(photoId, file, "about-photos");
  return setPhotoImagePath(photoId, imagePath, "about", expectedVersion);
}

/** Production path: the file was client-uploaded to Blob; persist its URL. */
export async function setAboutPhotoUrl(
  photoId: string,
  url: string,
  expectedVersion?: number,
) {
  return setPhotoImagePath(photoId, url, "about", expectedVersion);
}

export async function clearAboutPhoto(photoId: string, expectedVersion?: number) {
  const record = await readSiteRecord();
  if (expectedVersion !== undefined && record.version !== expectedVersion) {
    throw new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  const site = record.content;
  const photoIndex = site.about.photos.findIndex((photo) => photo.id === photoId);

  if (photoIndex === -1) {
    throw new StorageError("Photo not found.", 404);
  }

  const current = site.about.photos[photoIndex];
  const { imagePath: _removed, ...rest } = current;
  site.about.photos[photoIndex] = rest;
  await writeSiteContent(site, record.version);
  if (current.imagePath) {
    await deleteStoredPhoto(current.imagePath);
  }
  return site;
}

type VideoSlot = "hero" | "cta";

const VIDEO_DIRS: Record<VideoSlot, string> = {
  hero: HERO_VIDEO_DIR,
  cta: CTA_VIDEO_DIR,
};

async function saveVideoFile(slot: VideoSlot, file: File): Promise<string> {
  const ext = path.extname(file.name) || ".mp4";
  const filename = `${slot}-${randomUUID()}${ext}`;

  if (getUseBlobStorage()) {
    const blob = await put(`${slot}/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
      ...(file.type ? { contentType: file.type } : {}),
    });
    return blob.url;
  }

  await ensurePhotoDir(VIDEO_DIRS[slot]);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(VIDEO_DIRS[slot], filename), buffer);
  return `/uploads/${slot}/${filename}`;
}

async function replaceVideoPath(
  slot: VideoSlot,
  videoPath: string,
  expectedVersion?: number,
): Promise<SiteContent> {
  const record = await readSiteRecord();
  if (expectedVersion !== undefined && record.version !== expectedVersion) {
    await deleteStoredPhoto(videoPath);
    throw new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  const site = record.content;
  const previous =
    slot === "hero" ? site.hero.videoPath : site.closingCta.videoPath;

  if (slot === "hero") {
    site.hero = { ...site.hero, videoPath };
  } else {
    site.closingCta = { ...site.closingCta, videoPath };
  }

  try {
    await writeSiteContent(site, record.version);
  } catch (error) {
    if (videoPath !== previous) {
      await deleteStoredPhoto(videoPath);
    }
    throw error;
  }

  if (previous && previous !== videoPath) {
    await deleteStoredPhoto(previous);
  }

  return site;
}

async function clearVideoPath(
  slot: VideoSlot,
  expectedVersion?: number,
): Promise<SiteContent> {
  const record = await readSiteRecord();
  if (expectedVersion !== undefined && record.version !== expectedVersion) {
    throw new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  const site = record.content;
  const previous =
    slot === "hero" ? site.hero.videoPath : site.closingCta.videoPath;

  if (slot === "hero") {
    const { videoPath: _removed, ...hero } = site.hero;
    site.hero = hero;
  } else {
    const { videoPath: _removed, ...closingCta } = site.closingCta;
    site.closingCta = closingCta;
  }

  await writeSiteContent(site, record.version);

  if (previous) await deleteStoredPhoto(previous);

  return site;
}

/** Local/dev path: the video file arrives in the request body. */
export async function uploadHeroVideo(
  file: File,
  expectedVersion?: number,
): Promise<SiteContent> {
  return replaceVideoPath(
    "hero",
    await saveVideoFile("hero", file),
    expectedVersion,
  );
}

/** Production path: the file was client-uploaded to Blob; persist its URL. */
export async function setHeroVideoUrl(
  url: string,
  expectedVersion?: number,
): Promise<SiteContent> {
  return replaceVideoPath("hero", url, expectedVersion);
}

export async function clearHeroVideo(expectedVersion?: number): Promise<SiteContent> {
  return clearVideoPath("hero", expectedVersion);
}

export async function uploadCtaVideo(
  file: File,
  expectedVersion?: number,
): Promise<SiteContent> {
  return replaceVideoPath(
    "cta",
    await saveVideoFile("cta", file),
    expectedVersion,
  );
}

export async function setCtaVideoUrl(
  url: string,
  expectedVersion?: number,
): Promise<SiteContent> {
  return replaceVideoPath("cta", url, expectedVersion);
}

export async function clearCtaVideo(expectedVersion?: number): Promise<SiteContent> {
  return clearVideoPath("cta", expectedVersion);
}

export async function uploadCollagePhoto(
  photoId: string,
  file: File,
  expectedVersion?: number,
) {
  const imagePath = await savePhotoFile(photoId, file, "home-grid-photos");
  return setPhotoImagePath(photoId, imagePath, "collage", expectedVersion);
}

/** Production path: the file was client-uploaded to Blob; persist its URL. */
export async function setCollagePhotoUrl(
  photoId: string,
  url: string,
  expectedVersion?: number,
) {
  return setPhotoImagePath(photoId, url, "collage", expectedVersion);
}

export async function clearCollagePhoto(
  photoId: string,
  expectedVersion?: number,
) {
  const record = await readSiteRecord();
  if (expectedVersion !== undefined && record.version !== expectedVersion) {
    throw new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  const site = record.content;
  const photoIndex = site.photography.photos.findIndex(
    (photo) => photo.id === photoId,
  );

  if (photoIndex === -1) {
    throw new StorageError("Photo not found.", 404);
  }

  const current = site.photography.photos[photoIndex];
  const { imagePath: _removed, ...rest } = current;
  site.photography.photos[photoIndex] = rest;
  await writeSiteContent(site, record.version);
  if (current.imagePath) {
    await deleteStoredPhoto(current.imagePath);
  }
  return site;
}

export async function uploadBrandLogo(
  brandId: string,
  file: File,
  expectedVersion?: number,
) {
  const logoPath = await savePhotoFile(brandId, file, "brand-logos");
  return setBrandLogoUrl(brandId, logoPath, expectedVersion);
}

/** Production path: the file was client-uploaded to Blob; persist its URL. */
export async function setBrandLogoUrl(
  brandId: string,
  logoPath: string,
  expectedVersion?: number,
) {
  const record = await readSiteRecord();
  if (expectedVersion !== undefined && record.version !== expectedVersion) {
    await deleteStoredPhoto(logoPath);
    throw new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  const site = record.content;
  const brandIndex = site.brands.items.findIndex((brand) => brand.id === brandId);

  if (brandIndex === -1) {
    throw new StorageError("Brand not found.", 404);
  }

  const current = site.brands.items[brandIndex];
  site.brands.items[brandIndex] = { ...current, logoPath };
  try {
    await writeSiteContent(site, record.version);
  } catch (error) {
    if (logoPath !== current.logoPath) {
      await deleteStoredPhoto(logoPath);
    }
    throw error;
  }
  if (current.logoPath && current.logoPath !== logoPath) {
    await deleteStoredPhoto(current.logoPath);
  }
  return site;
}

export async function clearBrandLogo(
  brandId: string,
  expectedVersion?: number,
) {
  const record = await readSiteRecord();
  if (expectedVersion !== undefined && record.version !== expectedVersion) {
    throw new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  const site = record.content;
  const brandIndex = site.brands.items.findIndex((brand) => brand.id === brandId);

  if (brandIndex === -1) {
    throw new StorageError("Brand not found.", 404);
  }

  const current = site.brands.items[brandIndex];
  const { logoPath: _removed, ...rest } = current;
  site.brands.items[brandIndex] = rest;
  await writeSiteContent(site, record.version);
  if (current.logoPath) {
    await deleteStoredPhoto(current.logoPath);
  }
  return site;
}
