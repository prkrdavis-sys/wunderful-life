const FFMPEG_UMD =
  "https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js";
const FFMPEG_CORE_BASE =
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

const FFMPEG_LOAD_TIMEOUT_MS = 60_000;
const FFMPEG_CONVERT_TIMEOUT_MS = 180_000;

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
      return {
        maxEdge: 720,
        crf: 30,
        stripAudio: false,
        maxDurationSec: null,
        skipIfMp4UnderBytes: 2_000_000,
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
      return "Compressing looping video for the web…";
    case "portfolio":
      return "Compressing video for the web…";
    default: {
      const _exhaustive: never = profile;
      return _exhaustive;
    }
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

export async function prepareVideoForWebUpload(
  file: File,
  onProgress?: (message: string) => void,
  profile: VideoUploadProfile = "portfolio",
): Promise<File> {
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

  try {
    const compressed = await transcodeToMp4(file, profile, onProgress);
    if (isAlreadyMp4(file) && compressed.size >= file.size) {
      if (profile === "hero" && !(await mp4HasFastStart(file))) {
        try {
          return await remuxMp4FastStart(file, onProgress);
        } catch (error) {
          console.warn("Fast-start remux skipped:", error);
          return file;
        }
      }
      return file;
    }
    return compressed;
  } catch (error) {
    console.warn("Client video transcode skipped:", error);
    onProgress?.("Uploading original video…");
    return file;
  }
}
