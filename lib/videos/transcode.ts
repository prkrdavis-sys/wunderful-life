import { MAX_VIDEO_BYTES } from "@/lib/videos/upload";

const FFMPEG_UMD =
  "https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js";
const FFMPEG_CORE_BASE =
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

const FFMPEG_LOAD_TIMEOUT_MS = 60_000;
const FFMPEG_CONVERT_TIMEOUT_MS = 180_000;
const BROWSER_RECORD_TIMEOUT_MS = 180_000;
const MAX_SOURCE_VIDEO_BYTES = 250 * 1024 * 1024;

type FFmpegInstance = {
  loaded: boolean;
  load: (config: {
    coreURL: string;
    wasmURL: string;
  }) => Promise<boolean>;
  writeFile: (name: string, data: Uint8Array) => Promise<unknown>;
  exec: (args: string[]) => Promise<number>;
  readFile: (name: string) => Promise<Uint8Array | string>;
  deleteFile: (name: string) => Promise<unknown>;
};

type FFmpegConstructor = new () => FFmpegInstance;

declare global {
  interface Window {
    FFmpegWASM?: {
      FFmpeg: FFmpegConstructor;
    };
  }
}

let ffmpeg: FFmpegInstance | null = null;
let loadPromise: Promise<FFmpegInstance> | null = null;
let scriptPromise: Promise<void> | null = null;

function extensionFromFilename(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return filename.slice(dotIndex).toLowerCase();
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
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

async function readFileBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

async function toBlobURL(url: string, mimeType: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Video converter failed to download.");
  }
  const blob = await response.blob();
  return URL.createObjectURL(new Blob([blob], { type: mimeType }));
}

function loadFfmpegScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Video conversion must run in the browser."));
  }

  if (window.FFmpegWASM) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = withTimeout(
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          'script[data-ffmpeg-script="true"]',
        );
        if (existing) {
          if (window.FFmpegWASM) {
            resolve();
            return;
          }
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error("Video converter failed to load.")),
            { once: true },
          );
          return;
        }

        const script = document.createElement("script");
        script.src = FFMPEG_UMD;
        script.async = true;
        script.dataset.ffmpegScript = "true";
        script.onload = () => resolve();
        script.onerror = () =>
          reject(
            new Error("Video converter failed to load. Check your connection."),
          );
        document.head.appendChild(script);
      }),
      FFMPEG_LOAD_TIMEOUT_MS,
      "Video converter timed out while loading.",
    ).catch((error: unknown) => {
      scriptPromise = null;
      throw error;
    });
  }

  return scriptPromise;
}

export type VideoUploadProfile = "portfolio" | "hero" | "cta";

type CompressSettings = {
  maxEdge: number;
  crf: number;
  stripAudio: boolean;
  maxDurationSec: number | null;
  skipIfMp4UnderBytes: number;
};

function settingsForProfile(profile: VideoUploadProfile): CompressSettings {
  switch (profile) {
    case "hero":
      return {
        maxEdge: 720,
        crf: 32,
        stripAudio: true,
        maxDurationSec: 8,
        skipIfMp4UnderBytes: 1_200_000,
      };
    case "cta":
      // 1920 long-edge = 1080p for 9:16. 720 was 406×720 on portrait clips.
      return {
        maxEdge: 1920,
        crf: 23,
        stripAudio: false,
        maxDurationSec: null,
        skipIfMp4UnderBytes: 12_000_000,
      };
    case "portfolio":
      return {
        maxEdge: 1280,
        crf: 28,
        stripAudio: false,
        maxDurationSec: null,
        skipIfMp4UnderBytes: 5_000_000,
      };
    default: {
      const _exhaustive: never = profile;
      return _exhaustive;
    }
  }
}

function isAlreadyMp4(file: File): boolean {
  const ext = extensionFromFilename(file.name);
  return ext === ".mp4" || file.type === "video/mp4";
}

/**
 * True when the MP4 index (`moov`) appears before media data (`mdat`), so
 * playback can start without downloading the whole file first.
 */
async function mp4HasFastStart(file: File): Promise<boolean> {
  const probeSize = Math.min(file.size, 256 * 1024);
  if (probeSize < 8) return false;
  const bytes = new Uint8Array(await file.slice(0, probeSize).arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (offset + 8 <= view.byteLength) {
    let boxSize = view.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    if (type === "moov") return true;
    if (type === "mdat") return false;
    if (boxSize === 1) {
      if (offset + 16 > view.byteLength) break;
      if (view.getUint32(offset + 8) !== 0) break;
      boxSize = view.getUint32(offset + 12);
    }
    if (boxSize < 8) break;
    offset += boxSize;
  }
  return false;
}

export function needsWebTranscode(
  file: File,
  profile: VideoUploadProfile = "portfolio",
): boolean {
  const ext = extensionFromFilename(file.name);
  if (ext === ".mov" || ext === ".m4v" || ext === ".webm") return true;
  if (!isAlreadyMp4(file)) return true;
  return file.size > settingsForProfile(profile).skipIfMp4UnderBytes;
}

async function getFFmpeg(): Promise<FFmpegInstance> {
  if (ffmpeg?.loaded) return ffmpeg;

  if (!loadPromise) {
    loadPromise = (async () => {
      await loadFfmpegScript();
      const FFmpeg = window.FFmpegWASM?.FFmpeg;
      if (!FFmpeg) {
        throw new Error("Video converter failed to initialize.");
      }

      const instance = new FFmpeg();
      await withTimeout(
        instance.load({
          coreURL: await toBlobURL(
            `${FFMPEG_CORE_BASE}/ffmpeg-core.js`,
            "text/javascript",
          ),
          wasmURL: await toBlobURL(
            `${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        }),
        FFMPEG_LOAD_TIMEOUT_MS,
        "Video converter timed out while starting.",
      );
      ffmpeg = instance;
      return instance;
    })().catch((error: unknown) => {
      loadPromise = null;
      ffmpeg = null;
      throw new Error(
        toErrorMessage(
          error,
          "Video converter failed to load. Check your connection and try again.",
        ),
      );
    });
  }

  return loadPromise;
}

function scaleFilter(maxEdge: number): string {
  return `scale='if(gte(iw,ih),min(iw,${maxEdge}),-2)':'if(gt(ih,iw),min(ih,${maxEdge}),-2)',scale=trunc(iw/2)*2:trunc(ih/2)*2`;
}

function ffmpegArgs(
  profile: VideoUploadProfile,
  inputName: string,
  outputName: string,
): string[] {
  const settings = settingsForProfile(profile);
  const args = ["-i", inputName];
  if (settings.maxDurationSec !== null) {
    args.push("-t", String(settings.maxDurationSec));
  }
  args.push(
    "-map",
    "0:v:0",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    String(settings.crf),
    "-vf",
    scaleFilter(settings.maxEdge),
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
  );
  if (settings.stripAudio) {
    args.push("-an");
  } else {
    args.push("-map", "0:a:0?", "-c:a", "aac", "-b:a", "96k", "-ac", "2");
  }
  args.push(outputName);
  return args;
}

function progressMessage(profile: VideoUploadProfile): string {
  switch (profile) {
    case "hero":
      return "Compressing background video (short, muted, 720p)…";
    case "cta":
      return "Compressing looping video (1080p)…";
    case "portfolio":
      return "Compressing video for the web…";
    default: {
      const _exhaustive: never = profile;
      return _exhaustive;
    }
  }
}

function bitrateForProfile(profile: VideoUploadProfile): number {
  switch (profile) {
    case "hero":
      return 800_000;
    case "cta":
      return 5_000_000;
    case "portfolio":
      return 2_000_000;
    default: {
      const _exhaustive: never = profile;
      return _exhaustive;
    }
  }
}

function prefersBrowserRecorder(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iP(hone|ad|od)/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function pickRecorderMimeType(includeAudio: boolean): string {
  if (typeof MediaRecorder === "undefined") return "";

  const withAudio = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  const videoOnly = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  for (const type of includeAudio ? withAudio : videoOnly) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

type CapturableVideo = HTMLVideoElement & {
  captureStream?: (frameRate?: number) => MediaStream;
  mozCaptureStream?: (frameRate?: number) => MediaStream;
};

function waitForVideoEvent(
  video: HTMLVideoElement,
  event: "loadeddata" | "seeked" | "ended",
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Could not load this video to compress it."));
    };
    const cleanup = () => {
      video.removeEventListener(event, onSuccess);
      video.removeEventListener("error", onError);
    };
    video.addEventListener(event, onSuccess);
    video.addEventListener("error", onError);
    if (event === "loadeddata" && video.readyState >= 2) {
      cleanup();
      resolve();
    }
  });
}

function isAutoplayBlocked(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

/**
 * Browsers reject `play()` on an element that is not muted unless the call
 * happens inside a user gesture. Compression runs long after the file picker
 * closed, so the element must stay muted for the whole recording.
 */
async function playMutedForCapture(video: HTMLVideoElement): Promise<void> {
  video.muted = true;
  video.defaultMuted = true;
  try {
    await video.play();
  } catch (error) {
    if (isAutoplayBlocked(error)) {
      throw new Error("This browser blocked video playback while compressing.");
    }
    throw error;
  }
}

function captureAudioTracks(video: CapturableVideo): MediaStreamTrack[] {
  // A muted element still exposes its audio through captureStream, which is how
  // sound survives compression without triggering the autoplay policy.
  try {
    const captured =
      video.captureStream?.(30) ?? video.mozCaptureStream?.(30) ?? null;
    return captured?.getAudioTracks() ?? [];
  } catch (error) {
    console.warn("Could not capture audio while compressing:", error);
    return [];
  }
}

function extensionForRecorderMime(mimeType: string): { ext: string; type: string } {
  if (mimeType.startsWith("video/mp4")) {
    return { ext: ".mp4", type: "video/mp4" };
  }
  return { ext: ".webm", type: "video/webm" };
}

function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

async function transcodeWithMediaRecorder(
  file: File,
  profile: VideoUploadProfile,
  onProgress?: (message: string) => void,
): Promise<File> {
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot compress video.");
  }

  const settings = settingsForProfile(profile);
  const mimeType = pickRecorderMimeType(!settings.stripAudio);

  onProgress?.("Compressing video in this browser…");

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video") as CapturableVideo;
  const canvas = document.createElement("canvas");
  let canvasStream: MediaStream | null = null;
  let mixedStream: MediaStream | null = null;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.preload = "auto";
  video.controls = false;
  video.style.position = "fixed";
  video.style.left = "-9999px";
  video.style.width = "2px";
  video.style.height = "2px";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  document.body.appendChild(video);
  video.src = objectUrl;
  video.load();
  const playPromise = video.play();

  try {
    return await withTimeout(
      (async () => {
        await Promise.race([
          waitForVideoEvent(video, "loadeddata"),
          playPromise.then(
            () => undefined,
            () => undefined,
          ),
        ]);

        if (video.paused) {
          await playMutedForCapture(video);
        }

        const srcW = video.videoWidth;
        const srcH = video.videoHeight;
        if (!srcW || !srcH) {
          throw new Error("Could not read this video to compress it.");
        }

        const scale = Math.min(1, settings.maxEdge / Math.max(srcW, srcH));
        const width = Math.max(2, Math.round((srcW * scale) / 2) * 2);
        const height = Math.max(2, Math.round((srcH * scale) / 2) * 2);
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) {
          throw new Error("Could not compress this video.");
        }

        context.drawImage(video, 0, 0, width, height);

        canvasStream = canvas.captureStream(30);
        mixedStream = new MediaStream(canvasStream.getVideoTracks());
        const audioTracks = settings.stripAudio ? [] : captureAudioTracks(video);
        for (const track of audioTracks) {
          mixedStream.addTrack(track);
        }

        const hasAudio = audioTracks.length > 0;
        const recorder = new MediaRecorder(mixedStream, {
          ...(mimeType ? { mimeType } : {}),
          videoBitsPerSecond: bitrateForProfile(profile),
          ...(hasAudio ? { audioBitsPerSecond: 96_000 } : {}),
        });

        const chunks: Blob[] = [];
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        });

        const stopped = new Promise<void>((resolve, reject) => {
          recorder.addEventListener("stop", () => resolve(), { once: true });
          recorder.addEventListener(
            "error",
            () => reject(new Error("Could not compress this video.")),
            { once: true },
          );
        });

        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const clipDuration =
          settings.maxDurationSec !== null
            ? Math.min(settings.maxDurationSec, duration || settings.maxDurationSec)
            : duration;
        const timeoutMs =
          clipDuration > 0
            ? Math.min(
                BROWSER_RECORD_TIMEOUT_MS,
                Math.max(45_000, clipDuration * 3000 + 15_000),
              )
            : BROWSER_RECORD_TIMEOUT_MS;

        if (video.currentTime > 0.05) {
          const seeked = waitForVideoEvent(video, "seeked");
          video.currentTime = 0;
          await seeked;
        }

        recorder.start(250);
        await playMutedForCapture(video);

        const draw = () => {
          if (recorder.state !== "recording") return;
          context.drawImage(video, 0, 0, width, height);
          if (
            video.ended ||
            (settings.maxDurationSec !== null &&
              video.currentTime >= settings.maxDurationSec)
          ) {
            video.pause();
            if (recorder.state === "recording") recorder.stop();
            return;
          }
          if (!video.paused && !video.ended) {
            requestAnimationFrame(draw);
          }
        };

        const onEnded = () => {
          if (recorder.state === "recording") recorder.stop();
        };
        video.addEventListener("ended", onEnded, { once: true });
        requestAnimationFrame(draw);

        try {
          await withTimeout(stopped, timeoutMs, "Video compression timed out.");
        } finally {
          video.removeEventListener("ended", onEnded);
          if (recorder.state === "recording") recorder.stop();
        }

        const outputMime = recorder.mimeType || mimeType || "video/mp4";
        const blob = new Blob(chunks, { type: outputMime.split(";")[0] });
        if (blob.size === 0) {
          throw new Error("Could not compress this video.");
        }

        const { ext, type } = extensionForRecorderMime(outputMime);
        const baseName = file.name.replace(/\.[^.]+$/i, "") || "video";
        return new File([blob], `${baseName}${ext}`, {
          type,
          lastModified: Date.now(),
        });
      })(),
      BROWSER_RECORD_TIMEOUT_MS,
      "Video compression timed out.",
    );
  } finally {
    video.pause();
    stopStream(mixedStream);
    stopStream(canvasStream);
    video.removeAttribute("src");
    video.load();
    video.remove();
    URL.revokeObjectURL(objectUrl);
  }
}

async function transcodeToMp4(
  file: File,
  profile: VideoUploadProfile,
  onProgress?: (message: string) => void,
): Promise<File> {
  onProgress?.("Loading video converter…");
  const ff = await getFFmpeg();
  const inputExt = extensionFromFilename(file.name) || ".mov";
  const inputName = `input${inputExt}`;
  const outputName = "output.mp4";

  await ff.writeFile(inputName, await readFileBytes(file));
  onProgress?.(progressMessage(profile));

  const exitCode = await withTimeout(
    ff.exec(ffmpegArgs(profile, inputName, outputName)),
    FFMPEG_CONVERT_TIMEOUT_MS,
    "Video conversion timed out.",
  );

  if (exitCode !== 0) {
    throw new Error(
      "Could not compress this video. Export a smaller MP4 from Photos and try again.",
    );
  }

  const data = await ff.readFile(outputName);
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  const bytes =
    data instanceof Uint8Array ? new Uint8Array(data) : new TextEncoder().encode(data);

  if (bytes.byteLength === 0) {
    throw new Error(
      "Video conversion failed. Export as MP4 from Photos and try again.",
    );
  }

  const baseName = file.name.replace(/\.[^.]+$/i, "") || "video";
  return new File([bytes], `${baseName}.mp4`, {
    type: "video/mp4",
    lastModified: Date.now(),
  });
}

async function remuxMp4FastStart(
  file: File,
  onProgress?: (message: string) => void,
): Promise<File> {
  onProgress?.("Optimizing video so it can start sooner…");
  const ff = await getFFmpeg();
  const inputName = "input.mp4";
  const outputName = "output.mp4";

  await ff.writeFile(inputName, await readFileBytes(file));
  const exitCode = await withTimeout(
    ff.exec(["-i", inputName, "-c", "copy", "-movflags", "+faststart", outputName]),
    FFMPEG_CONVERT_TIMEOUT_MS,
    "Video conversion timed out.",
  );

  if (exitCode !== 0) {
    throw new Error("Could not optimize this video for fast start.");
  }

  const data = await ff.readFile(outputName);
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  const bytes =
    data instanceof Uint8Array ? new Uint8Array(data) : new TextEncoder().encode(data);

  if (bytes.byteLength === 0) {
    throw new Error("Could not optimize this video for fast start.");
  }

  const baseName = file.name.replace(/\.[^.]+$/i, "") || "video";
  return new File([bytes], `${baseName}.mp4`, {
    type: "video/mp4",
    lastModified: Date.now(),
  });
}

const FFMPEG_THUMBNAIL_TIMEOUT_MS = 45_000;

export async function extractThumbnailWithFfmpeg(file: File): Promise<File> {
  const ff = await getFFmpeg();
  const inputExt = extensionFromFilename(file.name) || ".mov";
  const inputName = `thumb-input${inputExt}`;
  const outputName = "thumb.jpg";

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
        scaleFilter(720),
        outputName,
      ]),
      FFMPEG_THUMBNAIL_TIMEOUT_MS,
      "Thumbnail capture timed out.",
    );

    if (exitCode !== 0) {
      throw new Error("Could not capture a thumbnail from this video.");
    }

    const data = await ff.readFile(outputName);
    const bytes =
      data instanceof Uint8Array
        ? new Uint8Array(data)
        : new TextEncoder().encode(data);

    if (bytes.byteLength === 0) {
      throw new Error("Could not capture a thumbnail from this video.");
    }

    const baseName = file.name.replace(/\.[^.]+$/i, "") || "video";
    return new File([bytes], `${baseName}-thumbnail.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
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

export type PrepareVideoOptions = {
  onProgress?: (message: string) => void;
  /** Called when the clip is uploaded uncompressed because compression failed. */
  onNotice?: (message: string) => void;
  profile?: VideoUploadProfile;
};

/**
 * Browser compression is a best-effort optimization, not a requirement. When
 * every strategy fails we still upload the original clip so a save is never
 * blocked by a codec or autoplay quirk in the admin's browser.
 */
export async function prepareVideoForWebUpload(
  file: File,
  options: PrepareVideoOptions = {},
): Promise<File> {
  const { onProgress, onNotice, profile = "portfolio" } = options;

  try {
    return await compressForWebUpload(file, profile, onProgress);
  } catch (error) {
    if (file.size > MAX_VIDEO_BYTES) throw error;

    console.warn("Falling back to the original video file:", error);
    onNotice?.(
      "Couldn't compress this clip in the browser, so the original was uploaded. It will play fine but may load more slowly.",
    );
    return file;
  }
}

async function compressForWebUpload(
  file: File,
  profile: VideoUploadProfile,
  onProgress?: (message: string) => void,
): Promise<File> {
  if (file.size > MAX_SOURCE_VIDEO_BYTES) {
    throw new Error(
      "That file is too large to compress in the browser. Export a smaller MP4 from Photos and try again.",
    );
  }

  if (!needsWebTranscode(file, profile)) {
    if (
      profile === "hero" &&
      isAlreadyMp4(file) &&
      !(await mp4HasFastStart(file))
    ) {
      try {
        return await remuxMp4FastStart(file, onProgress);
      } catch (error) {
        console.warn("Fast-start remux skipped:", error);
        return file;
      }
    }
    return file;
  }

  const compress = async (): Promise<File> => {
    if (prefersBrowserRecorder()) {
      return transcodeWithMediaRecorder(file, profile, onProgress);
    }

    try {
      return await transcodeToMp4(file, profile, onProgress);
    } catch (error) {
      console.warn("Client video transcode failed, trying browser recorder:", error);
      return transcodeWithMediaRecorder(file, profile, onProgress);
    }
  };

  const compressed = await compress();
  if (isAlreadyMp4(file) && compressed.size >= file.size) {
    if (profile === "hero" && !(await mp4HasFastStart(file))) {
      try {
        return await remuxMp4FastStart(file, onProgress);
      } catch (error) {
        console.warn("Fast-start remux skipped:", error);
        return assertUploadableVideo(file);
      }
    }
    return assertUploadableVideo(file);
  }

  return assertUploadableVideo(compressed);
}

function assertUploadableVideo(file: File): File {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(
      "That clip is still too large after compression. Export a shorter 720p or 1080p MP4 from Photos and try again.",
    );
  }
  return file;
}
