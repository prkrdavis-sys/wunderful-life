import { extensionFromFilename } from "@/lib/files";
import {
  attachHiddenVideo,
  detachHiddenVideo,
  waitForVideoDimensions,
  waitForVideoEvent,
  withTimeout,
} from "@/lib/videos/media-dom";
import {
  bytesFromFfmpegFile,
  fileFromBytes,
  getFFmpeg,
  readFileBytes,
} from "@/lib/videos/ffmpeg";

/**
 * Capture a still frame from a local video file for use as a thumbnail image.
 *
 * Must be started in the same user-gesture turn as the file picker when
 * possible. After a long async gap (e.g. transcode), iOS will refuse
 * `video.play()` and `videoWidth` stays 0.
 */
const EXTRACT_TIMEOUT_MS = 15_000;
const FFMPEG_THUMBNAIL_TIMEOUT_MS = 45_000;
const DECODE_WAIT_MS = 600;

function seekTargetSeconds(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0.04) return 0;
  return Math.min(
    Math.max(duration * 0.05, 0.1),
    Math.max(0, duration - 0.04),
    1,
  );
}

async function waitForDecodedFrame(video: HTMLVideoElement): Promise<void> {
  const wait =
    typeof video.requestVideoFrameCallback === "function"
      ? new Promise<void>((resolve) => {
          video.requestVideoFrameCallback(() => resolve());
        })
      : new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

  await Promise.race([
    wait,
    new Promise<void>((resolve) => {
      setTimeout(resolve, DECODE_WAIT_MS);
    }),
  ]);
}

export async function extractVideoFrame(
  file: File,
  options?: {
    /** Seconds into the video to capture. Defaults to a short offset. */
    seekTo?: number;
    mimeType?: "image/jpeg" | "image/png" | "image/webp";
    quality?: number;
  },
): Promise<File> {
  const mimeType = options?.mimeType ?? "image/jpeg";
  const quality = options?.quality ?? 0.74;
  const maxEdge = 720;
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  attachHiddenVideo(video);

  try {
    return await withTimeout(
      captureFrame(video, objectUrl, {
        seekTo: options?.seekTo,
        mimeType,
        quality,
        maxEdge,
        fileName: file.name,
      }),
      EXTRACT_TIMEOUT_MS,
      "Timed out capturing a thumbnail from this video.",
    );
  } finally {
    detachHiddenVideo(video);
    URL.revokeObjectURL(objectUrl);
  }
}

async function captureFrame(
  video: HTMLVideoElement,
  objectUrl: string,
  options: {
    seekTo?: number;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    quality: number;
    maxEdge: number;
    fileName: string;
  },
): Promise<File> {
  // Blob URLs are same-origin; setting crossOrigin can block decode in some browsers.
  video.src = objectUrl;
  video.load();

  // Kick decode immediately so iOS still counts this as the file-picker gesture.
  const playAttempt = video.play().then(
    () => true,
    () => false,
  );

  await waitForVideoEvent(
    video,
    "loadeddata",
    "Could not load video for thumbnail.",
  );
  await playAttempt;

  if (video.paused) {
    try {
      await video.play();
    } catch {
      // Autoplay may be blocked after a long async gap; still try to draw.
    }
  }

  const { width, height } = await waitForVideoDimensions(video);
  await waitForDecodedFrame(video);

  const duration = video.duration;
  const target =
    options.seekTo !== undefined
      ? Number.isFinite(duration) && duration > 0
        ? Math.min(options.seekTo, Math.max(0, duration - 0.04))
        : 0
      : seekTargetSeconds(duration);

  if (target > 0 && Math.abs(video.currentTime - target) > 0.04) {
    const seeked = waitForVideoEvent(
      video,
      "seeked",
      "Could not load video for thumbnail.",
    );
    video.currentTime = target;
    await seeked;
    await waitForDecodedFrame(video);
  }

  video.pause();

  if (!width || !height) {
    throw new Error("Could not read video dimensions for thumbnail.");
  }

  const scale = Math.min(1, options.maxEdge / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas for thumbnail.");
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Could not encode thumbnail image."));
      },
      options.mimeType,
      options.quality,
    );
  });

  const baseName = options.fileName.replace(/\.[^.]+$/, "") || "video";
  const extension =
    options.mimeType === "image/png"
      ? "png"
      : options.mimeType === "image/webp"
        ? "webp"
        : "jpg";

  return new File([blob], `${baseName}-thumbnail.${extension}`, {
    type: options.mimeType,
    lastModified: Date.now(),
  });
}

export async function extractThumbnailWithFfmpeg(file: File): Promise<File> {
  const ff = await getFFmpeg();
  const inputExt = extensionFromFilename(file.name) || ".mov";
  const inputName = `thumb-input${inputExt}`;
  const outputName = "thumb.jpg";

  try {
    await ff.writeFile(inputName, await readFileBytes(file));
    const exitCode = await withTimeout(
      ff.exec([
        "-i",
        inputName,
        "-frames:v",
        "1",
        "-q:v",
        "5",
        "-vf",
        "scale='min(iw,720)':-2",
        "-f",
        "image2",
        outputName,
      ]),
      FFMPEG_THUMBNAIL_TIMEOUT_MS,
      "Thumbnail capture timed out.",
    );

    if (exitCode !== 0) {
      throw new Error("Could not capture a thumbnail from this video.");
    }

    const data = await ff.readFile(outputName);
    const bytes = bytesFromFfmpegFile(data);

    if (bytes.byteLength === 0) {
      throw new Error("Could not capture a thumbnail from this video.");
    }

    const baseName = file.name.replace(/\.[^.]+$/i, "") || "video";
    return fileFromBytes(bytes, `${baseName}-thumbnail.jpg`, "image/jpeg");
  } finally {
    try {
      await ff.deleteFile(inputName);
    } catch {
      // File may not have been written.
    }
    try {
      await ff.deleteFile(outputName);
    } catch {
      // Frame grab may have failed before writing output.
    }
  }
}
