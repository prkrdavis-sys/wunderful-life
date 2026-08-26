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
  MAX_VIDEO_BYTES,
  videoContentTypeFromFilename,
  videoUploadErrorMessage,
} from "@/lib/videos/upload";
import {
  hasSiteDatabaseConfig,
  initializeStoredPortfolioLibrary,
  listStoredPortfolioLibraryRevisions,
  readStoredPortfolioLibrary,
  readStoredPortfolioLibraryRevision,
  saveStoredPortfolioLibrary,
  type ContentRevisionSummary,
  type StoredPortfolioLibrary,
} from "./database";
import { isHostedProduction } from "./runtime";
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

/** Bundled snapshot used only when the live store is unreachable. */
export async function readBundledPortfolioVideos(): Promise<PortfolioVideo[]> {
  return sortVideos(await readVideosFromLocalFile());
}

/**
 * The library plus the store version it was read at. `version` is null only
 * when the local JSON file is the real store (development without Supabase).
 */
type LibrarySnapshot = {
  videos: PortfolioVideo[];
  version: number | null;
};

/**
 * Read for display only. When the transactional store is configured, never
 * substitute the bundled JSON catalog — that file can be a stale transfer
 * snapshot and would flash old clips over the live admin library.
 */
async function readVideosFile(): Promise<PortfolioVideo[]> {
  if (hasSiteDatabaseConfig()) {
    return (await readLibraryForWrite()).videos;
  }

  return readVideosFromLocalFile();
}

/**
 * Read for read-modify-write. Propagates storage failures instead of falling
 * back, so a transient outage can never overwrite the live library with the
 * bundled catalog.
 */
async function readLibraryForWrite(): Promise<LibrarySnapshot> {
  if (!hasSiteDatabaseConfig()) {
    return { videos: await readVideosFromLocalFile(), version: null };
  }

  const stored = await readStoredPortfolioLibrary();
  if (stored) {
    return { videos: normalizeVideos(stored.videos), version: stored.version };
  }

  if (isHostedProduction()) {
    throw new StorageError(
      "The video library is missing. Restore it from Supabase history or a backup. Placeholder clips will not be shown.",
      503,
    );
  }

  const initialized = await initializeStoredPortfolioLibrary(
    await readVideosFromLocalFile(),
  );
  return {
    videos: normalizeVideos(initialized.videos),
    version: initialized.version,
  };
}

/**
 * Persist a library that was derived from `readLibraryForWrite`. The version
 * comes from that same read so a concurrent save is rejected instead of
 * silently discarding the other edit.
 */
async function writeVideosFile(
  videos: PortfolioVideo[],
  expectedVersion: number | null,
) {
  const normalized = sortVideos(normalizeVideos(videos));

  if (hasSiteDatabaseConfig()) {
    if (expectedVersion === null) {
      throw new StorageError(
        "The video library could not be read before saving. Reload and try again.",
        503,
      );
    }
    await saveStoredPortfolioLibrary(normalized, expectedVersion);
    return;
  }

  if (isHostedProduction()) {
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
    const { videos, version } = await readLibraryForWrite();
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
    await writeVideosFile(videos, version);
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
  const { videos, version } = await readLibraryForWrite();
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return null;

  const current = videos[index];
  let thumbnailPath = current.thumbnailPath;
  let videoPath = current.videoPath;
  // Replaced media is removed only after the new paths are saved, so a failed
  // save never leaves the entry pointing at a deleted file.
  const replacedPaths: string[] = [];

  if (isRemoteAssetUrl(files?.thumbnailUrl)) {
    thumbnailPath = files.thumbnailUrl;
  } else if (files?.thumbnail) {
    thumbnailPath = await saveUploadFile(files.thumbnail, "thumbnails");
  }
  if (thumbnailPath !== current.thumbnailPath) {
    replacedPaths.push(current.thumbnailPath);
  }

  if (isRemoteAssetUrl(files?.videoUrl)) {
    videoPath = files.videoUrl;
  } else if (files?.video) {
    validateVideoFile(files.video);
    videoPath = await saveUploadFile(files.video, "videos");
  }
  if (videoPath !== current.videoPath) {
    replacedPaths.push(current.videoPath);
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
  await writeVideosFile(videos, version);
  await Promise.all(replacedPaths.map((stale) => deleteStoredFile(stale)));
  return updated;
}

export async function deleteVideo(id: string) {
  const { videos, version } = await readLibraryForWrite();
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return false;

  const [removed] = videos.splice(index, 1);
  await writeVideosFile(
    videos.map((video, idx) => ({ ...video, sortOrder: idx })),
    version,
  );

  // Only discard the media once the metadata removal is durable, so a failed
  // save never leaves an entry pointing at files that no longer exist.
  await deleteStoredFile(removed.thumbnailPath);
  await deleteStoredFile(removed.videoPath);
  return true;
}

export async function reorderVideos(orderedIds: string[]) {
  const { videos, version } = await readLibraryForWrite();
  const reordered = applyOrder(videos, orderedIds);
  await writeVideosFile(reordered, version);
  return reordered;
}

export async function listPortfolioRevisions(
  limit = 20,
): Promise<ContentRevisionSummary[]> {
  if (!hasSiteDatabaseConfig()) return [];
  return listStoredPortfolioLibraryRevisions(limit);
}

export async function restorePortfolioRevision(
  version: number,
): Promise<StoredPortfolioLibrary> {
  if (!hasSiteDatabaseConfig()) {
    throw new StorageError(
      "History restore is available after the site is connected to Supabase.",
      503,
    );
  }

  const current = await readStoredPortfolioLibrary();
  if (!current) {
    throw new StorageError("The video library is missing.", 503);
  }

  const videos = normalizeVideos(
    await readStoredPortfolioLibraryRevision(version),
  );
  return saveStoredPortfolioLibrary(videos, current.version);
}
