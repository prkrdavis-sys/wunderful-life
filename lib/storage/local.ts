import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { UploadFiles } from "@/lib/videos/form";
import type {
  PortfolioVideo,
  VideoCreateInput,
  VideoUpdateInput,
} from "@/lib/videos/types";
import { reorderVideos as applyOrder, sortVideos } from "@/lib/videos/sort";
import { uniqueSlug } from "@/lib/videos/slugify";
import {
  isAcceptedVideoFile,
  videoContentTypeFromFilename,
  videoUploadErrorMessage,
} from "@/lib/videos/upload";
import {
  hasSiteDatabaseConfig,
  initializeStoredPortfolioLibrary,
  readStoredPortfolioLibrary,
  saveStoredPortfolioLibrary,
} from "./database";
import {
  deletePublicMedia,
  hasSupabaseMediaConfig,
  uploadPublicMedia,
} from "./supabase-media";
import { StorageError } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "videos.json");
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const VIDEO_DIR = path.join(UPLOADS_ROOT, "videos");
const THUMB_DIR = path.join(UPLOADS_ROOT, "thumbnails");

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

function normalizeVideo(video: PortfolioVideo): PortfolioVideo {
  return {
    ...video,
    tags: Array.isArray(video.tags)
      ? video.tags.filter(
          (tag): tag is string => typeof tag === "string" && tag.trim().length > 0,
        )
      : [],
  };
}

function normalizeVideos(videos: PortfolioVideo[]): PortfolioVideo[] {
  return videos.map(normalizeVideo);
}

async function ensureUploadDirs() {
  if (hasSupabaseMediaConfig()) return;
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  await fs.mkdir(THUMB_DIR, { recursive: true });
}

async function readVideosFromLocalFile(): Promise<PortfolioVideo[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as PortfolioVideo[];
    return Array.isArray(parsed) ? normalizeVideos(parsed) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function readVideosFile(): Promise<PortfolioVideo[]> {
  if (hasSiteDatabaseConfig()) {
    try {
      const stored = await readStoredPortfolioLibrary();
      if (stored) return normalizeVideos(stored.videos);

      const initialVideos = await readVideosFromLocalFile();
      const initialized = await initializeStoredPortfolioLibrary(initialVideos);
      return normalizeVideos(initialized.videos);
    } catch {
      // The bundled catalog is a read-only uptime fallback. Storage outages
      // must never be interpreted as an empty or deleted video library.
      return readVideosFromLocalFile();
    }
  }

  return readVideosFromLocalFile();
}

async function writeVideosFile(videos: PortfolioVideo[]) {
  const normalized = sortVideos(normalizeVideos(videos));

  if (hasSiteDatabaseConfig()) {
    const stored = await readStoredPortfolioLibrary();
    if (stored) {
      await saveStoredPortfolioLibrary(normalized, stored.version);
    } else {
      await initializeStoredPortfolioLibrary(normalized);
    }
    return;
  }

  if (process.env.VERCEL === "1") {
    throw new StorageError(
      "Video library storage is not configured. Add the Supabase credentials.",
      503,
    );
  }

  const content = `${JSON.stringify(normalized, null, 2)}\n`;
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, content);
}

async function saveUploadFile(
  file: File,
  dir: "videos" | "thumbnails",
): Promise<string> {
  const ext =
    path.extname(file.name).toLowerCase() || (dir === "videos" ? ".mp4" : ".jpg");
  const filename = `${randomUUID()}${ext}`;

  if (hasSupabaseMediaConfig()) {
    return uploadPublicMedia(
      `${dir}/${filename}`,
      file,
      dir === "videos"
        ? videoContentTypeFromFilename(file.name)
        : file.type || undefined,
    );
  }

  const targetDir = dir === "videos" ? VIDEO_DIR : THUMB_DIR;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(targetDir, filename), buffer);
  return `/uploads/${dir}/${filename}`;
}

async function deleteStoredFile(filePath: string) {
  if (filePath.startsWith("https://")) {
    try {
      await deletePublicMedia(filePath);
    } catch {
      // A stale file should not prevent its metadata from being replaced.
    }
    return;
  }

  if (!filePath.startsWith("/uploads/")) return;
  const absolute = path.join(process.cwd(), "public", filePath);
  try {
    await fs.unlink(absolute);
  } catch {
    // ignore missing files
  }
}

function assertCanPersistUploads() {
  if (process.env.VERCEL && !hasSupabaseMediaConfig()) {
    throw new StorageError(
      "Video uploads require Supabase media storage. Add the Supabase credentials and redeploy.",
      503,
    );
  }
}

function validateVideoFile(file: File) {
  if (!isAcceptedVideoFile(file)) {
    throw new StorageError(videoUploadErrorMessage(), 415);
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new StorageError("Video must be 50MB or smaller.", 413);
  }
}

function isRemoteAssetUrl(value: string | null | undefined): value is string {
  return Boolean(value?.startsWith("https://"));
}

async function rollbackClientUploads(files?: UploadFiles) {
  if (!files || !hasSupabaseMediaConfig()) return;

  const urls = [files.videoUrl, files.thumbnailUrl].filter(isRemoteAssetUrl);
  await Promise.all(urls.map((url) => deleteStoredFile(url)));
}

export async function listVideos() {
  return sortVideos(await readVideosFile());
}

export async function getVideoBySlug(slug: string) {
  const videos = await readVideosFile();
  return videos.find((video) => video.slug === slug) ?? null;
}

export async function getVideoById(id: string) {
  const videos = await readVideosFile();
  return videos.find((video) => video.id === id) ?? null;
}

export async function createVideo(input: VideoCreateInput, files?: UploadFiles) {
  assertCanPersistUploads();
  await ensureUploadDirs();

  try {
    const videos = await readVideosFile();
    const existingSlugs = videos.map((video) => video.slug);

    let thumbnailPath = isRemoteAssetUrl(files?.thumbnailUrl)
      ? files.thumbnailUrl
      : null;
    let videoPath = isRemoteAssetUrl(files?.videoUrl) ? files.videoUrl : null;

    if (files?.video) {
      validateVideoFile(files.video);
      videoPath = await saveUploadFile(files.video, "videos");
    }

    if (files?.thumbnail) {
      thumbnailPath = await saveUploadFile(files.thumbnail, "thumbnails");
    }

    if (!thumbnailPath || !videoPath) {
      throw new StorageError("Both thumbnail and video are required.");
    }

    const slug = input.slug
      ? uniqueSlug(input.slug, existingSlugs)
      : uniqueSlug(input.title, existingSlugs);

    const video: PortfolioVideo = {
      id: randomUUID(),
      slug,
      title: input.title,
      brand: input.brand,
      platform: input.platform,
      hook: input.hook,
      cta: input.cta,
      durationSec: input.durationSec,
      tags: input.tags,
      thumbnailPath,
      videoPath,
      featured: input.featured,
      sortOrder: input.sortOrder ?? videos.length,
      createdAt: new Date().toISOString(),
    };

    videos.push(video);
    await writeVideosFile(videos);
    return video;
  } catch (error) {
    await rollbackClientUploads(files);
    throw error;
  }
}

export async function updateVideo(
  id: string,
  input: VideoUpdateInput,
  files?: UploadFiles,
) {
  assertCanPersistUploads();
  await ensureUploadDirs();
  const videos = await readVideosFile();
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return null;

  const current = videos[index];
  let thumbnailPath = current.thumbnailPath;
  let videoPath = current.videoPath;

  if (isRemoteAssetUrl(files?.thumbnailUrl)) {
    await deleteStoredFile(current.thumbnailPath);
    thumbnailPath = files.thumbnailUrl;
  } else if (files?.thumbnail) {
    await deleteStoredFile(current.thumbnailPath);
    thumbnailPath = await saveUploadFile(files.thumbnail, "thumbnails");
  }

  if (isRemoteAssetUrl(files?.videoUrl)) {
    await deleteStoredFile(current.videoPath);
    videoPath = files.videoUrl;
  } else if (files?.video) {
    validateVideoFile(files.video);
    await deleteStoredFile(current.videoPath);
    videoPath = await saveUploadFile(files.video, "videos");
  }

  const existingSlugs = videos
    .filter((video) => video.id !== id)
    .map((video) => video.slug);

  const slug =
    input.slug !== undefined
      ? uniqueSlug(input.slug, existingSlugs)
      : input.title !== undefined
        ? uniqueSlug(input.title, existingSlugs)
        : current.slug;

  const patch = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as VideoUpdateInput;

  const updated: PortfolioVideo = {
    ...current,
    ...patch,
    slug,
    thumbnailPath,
    videoPath,
    tags: patch.tags ?? current.tags,
  };

  videos[index] = updated;
  await writeVideosFile(videos);
  return updated;
}

export async function deleteVideo(id: string) {
  const videos = await readVideosFile();
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return false;

  const [removed] = videos.splice(index, 1);
  await deleteStoredFile(removed.thumbnailPath);
  await deleteStoredFile(removed.videoPath);
  await writeVideosFile(
    videos.map((video, idx) => ({ ...video, sortOrder: idx })),
  );
  return true;
}

export async function reorderVideos(orderedIds: string[]) {
  const videos = await readVideosFile();
  const reordered = applyOrder(videos, orderedIds);
  await writeVideosFile(reordered);
  return reordered;
}
