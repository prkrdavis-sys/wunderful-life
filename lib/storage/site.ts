import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { normalizeSiteContent } from "@/lib/site/normalize";
import type { SiteContent } from "@/lib/site/types";
import {
  type VideoSlot,
  videoSlotDescriptor,
} from "@/lib/site/video-slots";
import {
  hasSiteDatabaseConfig,
  initializeStoredSiteContent,
  listStoredSiteContentRevisions,
  readStoredSiteContent,
  readStoredSiteContentRevision,
  saveStoredSiteContent,
  type ContentRevisionSummary,
  type StoredSiteContent,
} from "./database";
import { isHostedProduction } from "./runtime";
import {
  deletePublicMedia,
  hasSupabaseMediaConfig,
  uploadPublicMedia,
} from "./supabase-media";
import { StorageError } from "./types";

const SITE_PATH = path.join(process.cwd(), "data", "site.json");

type PhotoFolder =
  | "about-photos"
  | "home-grid-photos"
  | "brand-logos"
  | "hero-photos"
  | "cta-photos";

function hasServices(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const services = (value as { services?: unknown }).services;
  if (Array.isArray(services)) return true;
  return Boolean(
    services &&
      typeof services === "object" &&
      Array.isArray((services as { items?: unknown }).items),
  );
}

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
    hasServices(site) &&
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

/** Bundled snapshot used only when the live store is unreachable. */
export async function readBundledSiteRecord(): Promise<StoredSiteContent> {
  return {
    content: await readSiteFromFile(),
    version: 1,
    updatedAt: new Date(0).toISOString(),
  };
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

    if (isHostedProduction()) {
      throw new StorageError(
        "Production site content is missing. Restore it from Supabase history or a backup. Placeholder copy will not be shown.",
        503,
      );
    }

    const initialized = await initializeStoredSiteContent(
      await readSiteFromFile(),
    );
    return {
      ...initialized,
      content: normalizeSiteContent(initialized.content),
    };
  }

  if (isHostedProduction()) {
    throw new StorageError(
      "Production site content storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
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
  return writeSiteContent(content, expectedVersion);
}

async function deleteStoredPhoto(imagePath: string) {
  if (imagePath.startsWith("https://")) {
    try {
      await deletePublicMedia(imagePath);
    } catch {
      // A stale file should not prevent its metadata from being replaced.
    }
    return;
  }

  if (
    imagePath.startsWith("/about-photos/") ||
    imagePath.startsWith("/home-grid-photos/") ||
    imagePath.startsWith("/brand-logos/") ||
    imagePath.startsWith("/hero-photos/") ||
    imagePath.startsWith("/cta-photos/") ||
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

async function savePublicFile(
  file: File,
  options: {
    remotePath: string;
    localPublicPath: string;
    contentType?: string;
  },
): Promise<string> {
  if (hasSupabaseMediaConfig()) {
    return uploadPublicMedia(
      options.remotePath,
      file,
      options.contentType,
    );
  }

  const absolute = path.join(process.cwd(), "public", options.localPublicPath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolute, buffer);
  return `/${options.localPublicPath}`;
}

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
  return savePublicFile(file, {
    remotePath: `${folder}/${filename}`,
    localPublicPath: `${folder}/${filename}`,
    contentType: photoContentType(file),
  });
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
  const site = structuredClone(record.content);
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

/** Production path: the file was client-uploaded to Supabase; persist its URL. */
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
  const site = structuredClone(record.content);
  const photoIndex = site.about.photos.findIndex((photo) => photo.id === photoId);

  if (photoIndex === -1) {
    throw new StorageError("Photo not found.", 404);
  }

  const current = site.about.photos[photoIndex];
  const rest = { ...current };
  delete rest.imagePath;
  site.about.photos[photoIndex] = rest;
  await writeSiteContent(site, record.version);
  if (current.imagePath) {
    await deleteStoredPhoto(current.imagePath);
  }
  return site;
}

async function saveVideoFile(slot: VideoSlot, file: File): Promise<string> {
  const ext = path.extname(file.name) || ".mp4";
  const filename = `${slot}-${randomUUID()}${ext}`;
  return savePublicFile(file, {
    remotePath: `${slot}/${filename}`,
    localPublicPath: `uploads/${slot}/${filename}`,
    contentType: file.type || undefined,
  });
}

function slotMediaPaths(
  site: SiteContent,
  slot: VideoSlot,
): { videoPath?: string; posterPath?: string } {
  switch (slot) {
    case "hero":
      return {
        videoPath: site.hero.videoPath,
        posterPath: site.hero.posterPath,
      };
    default: {
      const _exhaustive: never = slot;
      return _exhaustive;
    }
  }
}

function applySlotMedia(
  site: SiteContent,
  slot: VideoSlot,
  videoPath: string,
  posterPath?: string,
) {
  switch (slot) {
    case "hero": {
      const hero = { ...site.hero, videoPath };
      if (posterPath) {
        hero.posterPath = posterPath;
      } else {
        delete hero.posterPath;
      }
      site.hero = hero;
      return;
    }
    default: {
      const _exhaustive: never = slot;
      return _exhaustive;
    }
  }
}

function clearSlotMedia(site: SiteContent, slot: VideoSlot) {
  switch (slot) {
    case "hero": {
      const hero = { ...site.hero };
      delete hero.videoPath;
      delete hero.posterPath;
      site.hero = hero;
      return;
    }
    default: {
      const _exhaustive: never = slot;
      return _exhaustive;
    }
  }
}

async function savePosterFile(slot: VideoSlot, file: File): Promise<string> {
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${slot}-poster-${randomUUID()}${ext}`;
  return savePublicFile(file, {
    remotePath: `${slot}/${filename}`,
    localPublicPath: `uploads/${slot}/${filename}`,
    contentType: file.type || "image/jpeg",
  });
}

async function replaceVideoPath(
  slot: VideoSlot,
  videoPath: string,
  expectedVersion?: number,
  posterPath?: string,
): Promise<SiteContent> {
  const record = await readSiteRecord();
  if (expectedVersion !== undefined && record.version !== expectedVersion) {
    await deleteStoredPhoto(videoPath);
    if (posterPath) await deleteStoredPhoto(posterPath);
    throw new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  const site = structuredClone(record.content);
  const previous = slotMediaPaths(site, slot);
  const previousVideo = previous.videoPath;
  const previousPoster = previous.posterPath;
  const nextPoster = posterPath ?? previousPoster;
  applySlotMedia(site, slot, videoPath, nextPoster);

  try {
    await writeSiteContent(site, record.version);
  } catch (error) {
    if (videoPath !== previousVideo) {
      await deleteStoredPhoto(videoPath);
    }
    if (posterPath && posterPath !== previousPoster) {
      await deleteStoredPhoto(posterPath);
    }
    throw error;
  }

  if (previousVideo && previousVideo !== videoPath) {
    await deleteStoredPhoto(previousVideo);
  }
  if (previousPoster && previousPoster !== nextPoster) {
    await deleteStoredPhoto(previousPoster);
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
  const site = structuredClone(record.content);
  const previous = slotMediaPaths(site, slot);
  const previousVideo = previous.videoPath;
  const previousPoster = previous.posterPath;
  clearSlotMedia(site, slot);

  await writeSiteContent(site, record.version);

  if (previousVideo) await deleteStoredPhoto(previousVideo);
  if (previousPoster) await deleteStoredPhoto(previousPoster);

  return site;
}

export async function uploadSlotVideo(
  slot: VideoSlot,
  file: File,
  expectedVersion?: number,
  poster?: File,
): Promise<SiteContent> {
  const { persistPoster } = videoSlotDescriptor(slot);
  const videoPath = await saveVideoFile(slot, file);
  let posterPath: string | undefined;
  try {
    if (persistPoster && poster) {
      posterPath = await savePosterFile(slot, poster);
    }
  } catch (error) {
    await deleteStoredPhoto(videoPath);
    throw error;
  }
  return replaceVideoPath(slot, videoPath, expectedVersion, posterPath);
}

export async function setSlotVideoUrl(
  slot: VideoSlot,
  url: string,
  expectedVersion?: number,
  posterUrl?: string,
): Promise<SiteContent> {
  return replaceVideoPath(slot, url, expectedVersion, posterUrl);
}

export async function clearSlotVideo(
  slot: VideoSlot,
  expectedVersion?: number,
): Promise<SiteContent> {
  return clearVideoPath(slot, expectedVersion);
}

export async function uploadCollagePhoto(
  photoId: string,
  file: File,
  expectedVersion?: number,
) {
  const imagePath = await savePhotoFile(photoId, file, "home-grid-photos");
  return setPhotoImagePath(photoId, imagePath, "collage", expectedVersion);
}

/** Production path: the file was client-uploaded to Supabase; persist its URL. */
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
  const site = structuredClone(record.content);
  const photoIndex = site.photography.photos.findIndex(
    (photo) => photo.id === photoId,
  );

  if (photoIndex === -1) {
    throw new StorageError("Photo not found.", 404);
  }

  const current = site.photography.photos[photoIndex];
  const rest = { ...current };
  delete rest.imagePath;
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

/** Production path: the file was client-uploaded to Supabase; persist its URL. */
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
  const site = structuredClone(record.content);
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
  const site = structuredClone(record.content);
  const brandIndex = site.brands.items.findIndex((brand) => brand.id === brandId);

  if (brandIndex === -1) {
    throw new StorageError("Brand not found.", 404);
  }

  const current = site.brands.items[brandIndex];
  const rest = { ...current };
  delete rest.logoPath;
  site.brands.items[brandIndex] = rest;
  await writeSiteContent(site, record.version);
  if (current.logoPath) {
    await deleteStoredPhoto(current.logoPath);
  }
  return site;
}

async function setHeroCreatorImagePath(
  imagePath: string | undefined,
  expectedVersion?: number,
): Promise<SiteContent> {
  const record = await readSiteRecord();
  if (expectedVersion !== undefined && record.version !== expectedVersion) {
    if (imagePath) await deleteStoredPhoto(imagePath);
    throw new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  const site = structuredClone(record.content);
  const previous = site.hero.creatorImagePath;
  const hero = { ...site.hero };
  if (imagePath) {
    hero.creatorImagePath = imagePath;
  } else {
    delete hero.creatorImagePath;
  }
  site.hero = hero;

  try {
    await writeSiteContent(site, record.version);
  } catch (error) {
    if (imagePath && imagePath !== previous) {
      await deleteStoredPhoto(imagePath);
    }
    throw error;
  }
  if (previous && previous !== imagePath) {
    await deleteStoredPhoto(previous);
  }
  return site;
}

export async function uploadHeroCreatorPhoto(
  file: File,
  expectedVersion?: number,
) {
  const imagePath = await savePhotoFile("creator", file, "hero-photos");
  return setHeroCreatorImagePath(imagePath, expectedVersion);
}

/** Production path: the file was client-uploaded to Supabase; persist its URL. */
export async function setHeroCreatorPhotoUrl(
  url: string,
  expectedVersion?: number,
) {
  return setHeroCreatorImagePath(url, expectedVersion);
}

export async function clearHeroCreatorPhoto(expectedVersion?: number) {
  return setHeroCreatorImagePath(undefined, expectedVersion);
}

async function setCtaPhotoImagePath(
  imagePath: string | undefined,
  expectedVersion?: number,
): Promise<SiteContent> {
  const record = await readSiteRecord();
  if (expectedVersion !== undefined && record.version !== expectedVersion) {
    if (imagePath) await deleteStoredPhoto(imagePath);
    throw new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  const site = structuredClone(record.content);
  const previous = site.closingCta.photo.imagePath;
  const photo = { ...site.closingCta.photo };
  if (imagePath) {
    photo.imagePath = imagePath;
  } else {
    delete photo.imagePath;
  }
  site.closingCta = { ...site.closingCta, photo };

  try {
    await writeSiteContent(site, record.version);
  } catch (error) {
    if (imagePath && imagePath !== previous) {
      await deleteStoredPhoto(imagePath);
    }
    throw error;
  }
  if (previous && previous !== imagePath) {
    await deleteStoredPhoto(previous);
  }
  return site;
}

export async function uploadCtaPhoto(
  file: File,
  expectedVersion?: number,
) {
  const imagePath = await savePhotoFile("cta-photo", file, "cta-photos");
  return setCtaPhotoImagePath(imagePath, expectedVersion);
}

/** Production path: the file was client-uploaded to Supabase; persist its URL. */
export async function setCtaPhotoUrl(
  url: string,
  expectedVersion?: number,
) {
  return setCtaPhotoImagePath(url, expectedVersion);
}

export async function clearCtaPhoto(expectedVersion?: number) {
  return setCtaPhotoImagePath(undefined, expectedVersion);
}

export async function listSiteContentRevisions(
  limit = 20,
): Promise<ContentRevisionSummary[]> {
  if (!hasSiteDatabaseConfig()) return [];
  return listStoredSiteContentRevisions(limit);
}

export async function restoreSiteContentRevision(
  version: number,
  expectedVersion: number,
): Promise<StoredSiteContent> {
  if (!hasSiteDatabaseConfig()) {
    throw new StorageError(
      "History restore is available after the site is connected to Supabase.",
      503,
    );
  }

  const content = normalizeSiteContent(
    await readStoredSiteContentRevision(version),
  );
  if (!isCompleteSiteContent(content)) {
    throw new StorageError("That saved version is missing required fields.", 400);
  }
  return saveStoredSiteContent(content, expectedVersion, "restore");
}
