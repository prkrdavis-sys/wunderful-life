import { del, get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { SiteContent } from "@/lib/site/types";
import {
  getUseBlobStorage,
  SITE_METADATA_BLOB_PATH,
} from "./blob";
import { StorageError } from "./types";

const SITE_PATH = path.join(process.cwd(), "data", "site.json");
const PHOTO_DIR = path.join(process.cwd(), "public", "about-photos");

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
    return JSON.parse(text) as SiteContent;
  } catch {
    return null;
  }
}

export async function readSiteContent(): Promise<SiteContent> {
  const blobSite = await readSiteFromBlob();
  if (blobSite !== null) return blobSite;

  const raw = await fs.readFile(SITE_PATH, "utf8");
  return JSON.parse(raw) as SiteContent;
}

export async function writeSiteContent(content: SiteContent) {
  if (process.env.VERCEL && !getUseBlobStorage()) {
    throw new StorageError(
      "Site edits require Vercel Blob storage. Create a Blob store in your Vercel project and redeploy.",
      503,
    );
  }

  const json = `${JSON.stringify(content, null, 2)}\n`;

  if (getUseBlobStorage()) {
    await put(SITE_METADATA_BLOB_PATH, json, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await fs.writeFile(SITE_PATH, json);
}

export async function updateSiteContent(content: SiteContent) {
  await writeSiteContent(content);
  return content;
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
