/**
 * Capture a still frame from a local video file for use as a thumbnail image.
 */
export async function extractVideoFrame(
  file: File,
  options?: {
    /** Seconds into the video to capture. Defaults to ~0.1s (or mid-clip if shorter). */
    seekTo?: number;
    mimeType?: "image/jpeg" | "image/png" | "image/webp";
    quality?: number;
  },
): Promise<File> {
  const seekTo = options?.seekTo ?? 0.1;
  const mimeType = options?.mimeType ?? "image/jpeg";
  const quality = options?.quality ?? 0.74;
  const maxEdge = 720;
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("Could not load video for thumbnail."));
      };
      const cleanup = () => {
        video.removeEventListener("loadeddata", onLoaded);
        video.removeEventListener("error", onError);
      };
      video.addEventListener("loadeddata", onLoaded);
      video.addEventListener("error", onError);
    });

    const duration = video.duration;
    const target =
      Number.isFinite(duration) && duration > 0
        ? Math.min(seekTo, Math.max(0, duration * 0.05))
        : 0;

    if (target > 0 || video.currentTime !== 0) {
      await new Promise<void>((resolve, reject) => {
        const onSeeked = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error("Could not seek video for thumbnail."));
        };
        const cleanup = () => {
          video.removeEventListener("seeked", onSeeked);
          video.removeEventListener("error", onError);
        };
        video.addEventListener("seeked", onSeeked);
        video.addEventListener("error", onError);
        video.currentTime = target;
      });
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      throw new Error("Could not read video dimensions for thumbnail.");
    }

    const scale = Math.min(1, maxEdge / Math.max(width, height));
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
        mimeType,
        quality,
      );
    });

    const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
    const extension =
      mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";

    return new File([blob], `${baseName}-thumbnail.${extension}`, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
