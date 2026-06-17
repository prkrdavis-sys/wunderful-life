import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { SiteContent } from "@/lib/site/types";
import { StorageError } from "./types";

const SITE_PATH = path.join(process.cwd(), "data", "site.json");
const PHOTO_DIR = path.join(process.cwd(), "public", "uploads", "photos");

async function ensurePhotoDir() {
  await fs.mkdir(PHOTO_DIR, { recursive: true });
}

export async function readSiteContent(): Promise<SiteContent> {
  const raw = await fs.readFile(SITE_PATH, "utf8");
  return JSON.parse(raw) as SiteContent;
}

export async function writeSiteContent(content: SiteContent) {
  await fs.writeFile(SITE_PATH, `${JSON.stringify(content, null, 2)}\n`);
}

export async function updateSiteContent(content: SiteContent) {
  await writeSiteContent(content);
  return content;
}

export async function uploadAboutPhoto(photoId: string, file: File) {
  await ensurePhotoDir();
  const site = await readSiteContent();
  const photoIndex = site.about.photos.findIndex((photo) => photo.id === photoId);

  if (photoIndex === -1) {
    throw new StorageError("Photo not found.", 404);
  }

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${photoId}-${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(PHOTO_DIR, filename), buffer);

  const imagePath = `/uploads/photos/${filename}`;
  const current = site.about.photos[photoIndex];

  if (current.imagePath?.startsWith("/uploads/photos/")) {
    const absolute = path.join(process.cwd(), "public", current.imagePath);
    try {
      await fs.unlink(absolute);
    } catch {
      // ignore missing files
    }
  }

  site.about.photos[photoIndex] = { ...current, imagePath };
  await writeSiteContent(site);
  return site;
}
