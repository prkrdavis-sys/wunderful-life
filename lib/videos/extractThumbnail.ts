import { extensionFromFilename } from "@/lib/files";
import { waitForVideoEvent, withTimeout } from "@/lib/videos/media-dom";
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

async function waitForDecodedFrame(video: HTMLVideoElement): Promise<void> {
  if (typeof video.requestVideoFrameCallback === "function") {
    await new Promise<void>((resolve) => {
      video.requestVideoFrameCallback(() => resolve());
    });
    return;
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function extractVideoFrame(
  file: File,
  options?: {
    /** Seconds into the video to capture. Defaults to the first frame. */
    seekTo?: number;
    mimeType?: "image/jpeg" | "image/png" | "image/webp";
    quality?: number;
  },
): Promise<File> {
  const seekTo = options?.seekTo ?? 0;
  const mimeType = options?.mimeType ?? "image/jpeg";
  const quality = options?.quality ?? 0.74;
  const maxEdge = 720;
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");

  try {
    return await withTimeout(
      captureFrame(video, objectUrl, {
        seekTo,
        mimeType,
        quality,
        maxEdge,
        fileName: file.name,
      }),
      EXTRACT_TIMEOUT_MS,
      "Timed out capturing a thumbnail from this video.",
    );
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

async function captureFrame(
  video: HTMLVideoElement,
  objectUrl: string,
  options: {
    seekTo: number;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    quality: number;
    maxEdge: number;
    fileName: string;
  },
): Promise<File> {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.src = objectUrl;
  video.load();

  // Kick decode immediately so iOS still counts this as the file-picker gesture.
  const playAttempt = video.play().then(
    () => true,
    () => false,
  );

  await Promise.race([
    waitForVideoEvent(video, "loadeddata", "Could not load video for thumbnail."),
    playAttempt.then(() => undefined),
  ]);

  if (video.paused) {
    try {
      await video.play();
    } catch {
      // Autoplay may be blocked after a long async gap; still try to draw.
    }
  }

  await waitForDecodedFrame(video);

  const duration = video.duration;
  const target =
    Number.isFinite(duration) && duration > 0
      ? Math.min(options.seekTo, Math.max(0, duration * 0.05))
      : 0;

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

  const width = video.videoWidth;
  const height = video.videoHeight;
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
  const scaleToLongEdge =
    "scale='if(gte(iw,ih),min(iw,720),-2)':'if(gt(ih,iw),min(ih,720),-2)',scale=trunc(iw/2)*2:trunc(ih/2)*2";

  try {
    await ff.writeFile(inputName, await readFileBytes(file));
    const exitCode = await withTimeout(
      ff.exec([
        "-ss",
        "0",
        "-i",
        inputName,
        "-frames:v",
        "1",
        "-q:v",
        "5",
        "-vf",
        scaleToLongEdge,
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
