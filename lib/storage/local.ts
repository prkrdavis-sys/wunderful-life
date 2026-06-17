import { del, get, put } from "@vercel/blob";
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
import { useBlobStorage, VIDEOS_METADATA_BLOB_PATH } from "./blob";
import { StorageError } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "videos.json");
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const VIDEO_DIR = path.join(UPLOADS_ROOT, "videos");
const THUMB_DIR = path.join(UPLOADS_ROOT, "thumbnails");

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

async function ensureUploadDirs() {
  if (useBlobStorage) return;
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  await fs.mkdir(THUMB_DIR, { recursive: true });
}

async function readVideosFromBlob(): Promise<PortfolioVideo[] | null> {
  if (!useBlobStorage) return null;

  try {
    const result = await get(VIDEOS_METADATA_BLOB_PATH, { access: "public" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const text = await new Response(result.stream).text();
    return JSON.parse(text) as PortfolioVideo[];
  } catch {
    return null;
  }
}

async function readVideosFile(): Promise<PortfolioVideo[]> {
  const blobVideos = await readVideosFromBlob();
  if (blobVideos) return blobVideos;

  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw) as PortfolioVideo[];
}

async function writeVideosFile(videos: PortfolioVideo[]) {
  if (process.env.VERCEL && !useBlobStorage) {
    throw new StorageError(
      "Video uploads require Vercel Blob storage. Create a Blob store in your Vercel project and redeploy.",
      503,
    );
  }

  const content = `${JSON.stringify(sortVideos(videos), null, 2)}\n`;

  if (useBlobStorage) {
    await put(VIDEOS_METADATA_BLOB_PATH, content, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await fs.writeFile(DATA_PATH, content);
}

async function saveUploadFile(
  file: File,
  dir: "videos" | "thumbnails",
): Promise<string> {
  const ext = path.extname(file.name) || (dir === "videos" ? ".mp4" : ".jpg");
  const filename = `${randomUUID()}${ext}`;

  if (useBlobStorage) {
    const blob = await put(`${dir}/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
      multipart: dir === "videos",
      contentType:
        dir === "videos"
          ? videoContentTypeFromFilename(file.name)
          : undefined,
    });
    return blob.url;
  }

  const targetDir = dir === "videos" ? VIDEO_DIR : THUMB_DIR;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(targetDir, filename), buffer);
  return `/uploads/${dir}/${filename}`;
}

async function deleteStoredFile(filePath: string) {
  if (filePath.startsWith("https://")) {
    if (useBlobStorage) {
      try {
        await del(filePath);
      } catch {
        // ignore missing blobs
      }
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
  if (process.env.VERCEL && !useBlobStorage) {
    throw new StorageError(
      "Video uploads require Vercel Blob storage. Create a Blob store in your Vercel project and redeploy.",
      503,
    );
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

function isRemoteAssetUrl(value: string | null | undefined): value is string {
  return Boolean(value?.startsWith("https://"));
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
