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
import { StorageError } from "./types";

const SITE_PATH = path.join(process.cwd(), "data", "site.json");
const PHOTO_DIR = path.join(process.cwd(), "public", "about-photos");

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
    Array.isArray(site.services)
  );
}

async function readSiteFromFile(): Promise<SiteContent> {
  const raw = await fs.readFile(SITE_PATH, "utf8");
  const parsed = JSON.parse(raw) as SiteContent;
  return normalizeSiteContent(parsed);
}

async function ensurePhotoDir() {
  await fs.mkdir(PHOTO_DIR, { recursive: true });
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
  } catch {
    return null;
  }
}

export async function readSiteContent(): Promise<SiteContent> {
  const blobSite = await readSiteFromBlob();
  if (blobSite !== null) return blobSite;

  return readSiteFromFile();
}

export async function writeSiteContent(content: SiteContent) {
  if (!isCompleteSiteContent(content)) {
    throw new StorageError("Invalid site content.", 400);
  }

  const json = `${JSON.stringify(content, null, 2)}\n`;

  if (getUseBlobStorage()) {
    try {
      await put(SITE_METADATA_BLOB_PATH, json, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 60,
      });
      return;
    } catch (error) {
      if (readEnv("VERCEL") === "1") {
        throw new StorageError(
          toErrorMessage(
            error,
            "Could not save site content to Vercel Blob. Check that a Blob store is linked to this project.",
          ),
          503,
        );
      }
      throw error;
    }
  }

  await fs.writeFile(SITE_PATH, json);
}

function readEnv(name: string): string | undefined {
  return process.env[name];
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

export async function updateSiteContent(content: SiteContent) {
  const normalized = normalizeSiteContent(content);
  await writeSiteContent(normalized);
  return normalized;
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
    imagePath.startsWith("/uploads/photos/")
  ) {
    const absolute = path.join(process.cwd(), "public", imagePath);
    try {
      await fs.unlink(absolute);
    } catch {
      // ignore missing files
    }
  }
}

async function savePhotoFile(photoId: string, file: File): Promise<string> {
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${photoId}-${randomUUID()}${ext}`;

  if (getUseBlobStorage()) {
    const blob = await put(`about-photos/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  await ensurePhotoDir();
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(PHOTO_DIR, filename), buffer);
  return `/about-photos/${filename}`;
}

export async function uploadAboutPhoto(photoId: string, file: File) {
  const site = await readSiteContent();
  const photoIndex = site.about.photos.findIndex((photo) => photo.id === photoId);

  if (photoIndex === -1) {
    throw new StorageError("Photo not found.", 404);
  }

  const current = site.about.photos[photoIndex];
  const imagePath = await savePhotoFile(photoId, file);

  if (current.imagePath) {
    await deleteStoredPhoto(current.imagePath);
  }

  site.about.photos[photoIndex] = { ...current, imagePath };
  await writeSiteContent(site);
  return site;
}
