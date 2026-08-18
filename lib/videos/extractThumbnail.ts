/**
 * Capture a still frame from a local video file for use as a thumbnail image.
 *
 * Must be started in the same user-gesture turn as the file picker when
 * possible. After a long async gap (e.g. transcode), iOS will refuse
 * `video.play()` and `videoWidth` stays 0.
 */
const EXTRACT_TIMEOUT_MS = 15_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function waitForVideoEvent(
  video: HTMLVideoElement,
  event: "loadedmetadata" | "loadeddata" | "seeked",
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Could not load video for thumbnail."));
    };
    const cleanup = () => {
      video.removeEventListener(event, onSuccess);
      video.removeEventListener("error", onError);
    };
    if (event === "loadedmetadata" && video.readyState >= 1) {
      resolve();
      return;
    }
    if (event === "loadeddata" && video.readyState >= 2) {
      resolve();
      return;
    }
    video.addEventListener(event, onSuccess);
    video.addEventListener("error", onError);
  });
}

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
    waitForVideoEvent(video, "loadeddata"),
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
    const seeked = waitForVideoEvent(video, "seeked");
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
