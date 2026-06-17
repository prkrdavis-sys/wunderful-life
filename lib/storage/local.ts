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
  videoUploadErrorMessage,
} from "@/lib/videos/upload";
import { StorageError } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "videos.json");
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const VIDEO_DIR = path.join(UPLOADS_ROOT, "videos");
const THUMB_DIR = path.join(UPLOADS_ROOT, "thumbnails");

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

async function ensureUploadDirs() {
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  await fs.mkdir(THUMB_DIR, { recursive: true });
}

async function readVideosFile(): Promise<PortfolioVideo[]> {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw) as PortfolioVideo[];
}

async function writeVideosFile(videos: PortfolioVideo[]) {
  await fs.writeFile(DATA_PATH, `${JSON.stringify(sortVideos(videos), null, 2)}\n`);
}

async function saveUploadFile(
  file: File,
  dir: "videos" | "thumbnails",
): Promise<string> {
  const ext = path.extname(file.name) || (dir === "videos" ? ".mp4" : ".jpg");
  const filename = `${randomUUID()}${ext}`;
  const targetDir = dir === "videos" ? VIDEO_DIR : THUMB_DIR;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(targetDir, filename), buffer);
  return `/uploads/${dir}/${filename}`;
}

async function deleteFileIfLocal(filePath: string) {
  if (!filePath.startsWith("/uploads/")) return;
  const absolute = path.join(process.cwd(), "public", filePath);
  try {
    await fs.unlink(absolute);
  } catch {
    // ignore missing files
  }
}

function validateVideoFile(file: File) {
  if (!isAcceptedVideoFile(file)) {
    throw new StorageError(videoUploadErrorMessage(), 415);
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new StorageError("Video must be 100MB or smaller.", 413);
  }
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
  await ensureUploadDirs();
  const videos = await readVideosFile();
  const existingSlugs = videos.map((video) => video.slug);

  const thumbnailPath = files?.thumbnail
    ? await saveUploadFile(files.thumbnail, "thumbnails")
    : null;
  const videoPath = files?.video
    ? await saveUploadFile(files.video, "videos")
    : null;

  if (files?.video) {
    validateVideoFile(files.video);
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
}

export async function updateVideo(
  id: string,
  input: VideoUpdateInput,
  files?: UploadFiles,
) {
  await ensureUploadDirs();
  const videos = await readVideosFile();
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return null;

  const current = videos[index];
  let thumbnailPath = current.thumbnailPath;
  let videoPath = current.videoPath;

  if (files?.thumbnail) {
    await deleteFileIfLocal(current.thumbnailPath);
    thumbnailPath = await saveUploadFile(files.thumbnail, "thumbnails");
  }
  if (files?.video) {
    validateVideoFile(files.video);
    await deleteFileIfLocal(current.videoPath);
    videoPath = await saveUploadFile(files.video, "videos");
  }

  const existingSlugs = videos
    .filter((video) => video.id !== id)
    .map((video) => video.slug);

  const slug = input.slug
    ? uniqueSlug(input.slug, existingSlugs)
    : input.title
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
  await deleteFileIfLocal(removed.thumbnailPath);
  await deleteFileIfLocal(removed.videoPath);
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
