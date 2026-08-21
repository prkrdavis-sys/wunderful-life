import { toErrorMessage } from "@/lib/errors";
import { extensionFromFilename } from "@/lib/files";
import { MAX_VIDEO_BYTES } from "@/lib/videos/upload";
import { waitForVideoEvent, withTimeout } from "@/lib/videos/media-dom";
import {
  bytesFromFfmpegFile,
  fileFromBytes,
  getFFmpeg,
  readFileBytes,
} from "@/lib/videos/ffmpeg";
import type { VideoUploadProfile } from "@/lib/videos/profile";

export type { VideoUploadProfile };

const FFMPEG_CONVERT_TIMEOUT_MS = 180_000;
const BROWSER_RECORD_TIMEOUT_MS = 180_000;
const MAX_SOURCE_VIDEO_BYTES = 250 * 1024 * 1024;

type CompressSettings = {
  /** Short edge, i.e. true 720p / 1080p. Long-edge 720 made portrait clips 406×720. */
  maxShortEdge: number;
  crf: number;
  stripAudio: boolean;
  maxDurationSec: number | null;
  skipIfMp4UnderBytes: number;
  progressMessage: string;
  bitrate: number;
  requireMp4: boolean;
};

const COMPRESS_SETTINGS: Record<VideoUploadProfile, CompressSettings> = {
  hero: {
    maxShortEdge: 1080,
    crf: 23,
    stripAudio: true,
    maxDurationSec: 8,
    skipIfMp4UnderBytes: 8_000_000,
    progressMessage: "Compressing background video (1080p, muted)…",
    bitrate: 4_500_000,
    requireMp4: true,
  },
  cta: {
    maxShortEdge: 1080,
    crf: 23,
    stripAudio: false,
    maxDurationSec: null,
    skipIfMp4UnderBytes: 12_000_000,
    progressMessage: "Compressing looping video (1080p)…",
    bitrate: 5_000_000,
    requireMp4: false,
  },
  portfolio: {
    maxShortEdge: 720,
    crf: 26,
    stripAudio: false,
    maxDurationSec: null,
    skipIfMp4UnderBytes: 5_000_000,
    progressMessage: "Compressing video for the web…",
    bitrate: 2_500_000,
    requireMp4: false,
  },
};

function settingsForProfile(profile: VideoUploadProfile): CompressSettings {
  return COMPRESS_SETTINGS[profile];
}

export function isMp4File(file: File): boolean {
  return extensionFromFilename(file.name) === ".mp4" || file.type === "video/mp4";
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
  if (!isMp4File(file)) return true;
  return file.size > settingsForProfile(profile).skipIfMp4UnderBytes;
}

function scaleToShortEdge(maxShortEdge: number): string {
  return `scale='if(gte(iw,ih),-2,min(iw,${maxShortEdge}))':'if(gt(ih,iw),-2,min(ih,${maxShortEdge}))',scale=trunc(iw/2)*2:trunc(ih/2)*2`;
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
    scaleToShortEdge(settings.maxShortEdge),
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
          waitForVideoEvent(
            video,
            "loadeddata",
            "Could not load this video to compress it.",
          ),
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

        const scale = Math.min(1, settings.maxShortEdge / Math.min(srcW, srcH));
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
          videoBitsPerSecond: settings.bitrate,
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
  onProgress?.(settingsForProfile(profile).progressMessage);

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

  const bytes = bytesFromFfmpegFile(data);

  if (bytes.byteLength === 0) {
    throw new Error(
      "Video conversion failed. Export as MP4 from Photos and try again.",
    );
  }

  const baseName = file.name.replace(/\.[^.]+$/i, "") || "video";
  return fileFromBytes(bytes, `${baseName}.mp4`, "video/mp4");
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

  const bytes = bytesFromFfmpegFile(data);

  if (bytes.byteLength === 0) {
    throw new Error("Could not optimize this video for fast start.");
  }

  const baseName = file.name.replace(/\.[^.]+$/i, "") || "video";
  return fileFromBytes(bytes, `${baseName}.mp4`, "video/mp4");
}

function assertUploadableVideo(file: File): File {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(
      "That clip is still too large after compression. Export a shorter 720p or 1080p MP4 from Photos and try again.",
    );
  }
  return file;
}

function assertProfileOutput(file: File, profile: VideoUploadProfile): File {
  const uploadable = assertUploadableVideo(file);
  if (settingsForProfile(profile).requireMp4 && !isMp4File(uploadable)) {
    throw new Error(
      "This clip could not be converted for phones. Export an MP4 from Photos and try again.",
    );
  }
  return uploadable;
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

  const settings = settingsForProfile(profile);

  if (!needsWebTranscode(file, profile)) {
    if (settings.requireMp4 && isMp4File(file) && !(await mp4HasFastStart(file))) {
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
  if (isMp4File(file) && compressed.size >= file.size) {
    if (settings.requireMp4 && !(await mp4HasFastStart(file))) {
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

export type PrepareVideoOptions = {
  onProgress?: (message: string) => void;
  /** Called when the clip is uploaded uncompressed because compression failed. */
  onNotice?: (message: string) => void;
  profile?: VideoUploadProfile;
};

/**
 * Browser compression is a best-effort optimization, not a requirement. When
 * every strategy fails we still upload the original clip so a save is never
 * blocked by a codec or autoplay quirk in the admin's browser — except
 * profiles that require an MP4 (hero), which phones cannot play as MOV/WebM.
 */
export async function prepareVideoForWebUpload(
  file: File,
  options: PrepareVideoOptions = {},
): Promise<File> {
  const { onProgress, onNotice, profile = "portfolio" } = options;
  const settings = settingsForProfile(profile);

  try {
    return assertProfileOutput(
      await compressForWebUpload(file, profile, onProgress),
      profile,
    );
  } catch (error) {
    if (file.size > MAX_VIDEO_BYTES) throw error;

    if (settings.requireMp4 && !isMp4File(file)) {
      throw new Error(
        toErrorMessage(
          error,
          "This clip could not be converted for phones. Export an MP4 from Photos and try again.",
        ),
      );
    }

    console.warn("Falling back to the original video file:", error);
    onNotice?.(
      "Couldn't compress this clip in the browser, so the original was uploaded. It will play fine but may load more slowly.",
    );
    return assertProfileOutput(file, profile);
  }
}
