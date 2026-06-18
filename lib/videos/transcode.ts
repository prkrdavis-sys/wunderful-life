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

export function needsWebTranscode(file: File): boolean {
  const ext = extensionFromFilename(file.name);
  return ext === ".mov" || ext === ".m4v";
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

async function transcodeToMp4(
  file: File,
  onProgress?: (message: string) => void,
): Promise<File> {
  onProgress?.("Loading video converter…");
  const ff = await getFFmpeg();
  const inputExt = extensionFromFilename(file.name) || ".mov";
  const inputName = `input${inputExt}`;
  const outputName = "output.mp4";

  await ff.writeFile(inputName, await readFileBytes(file));
  onProgress?.("Converting iPhone video for web playback…");

  const exitCode = await withTimeout(
    ff.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      outputName,
    ]),
    FFMPEG_CONVERT_TIMEOUT_MS,
    "Video conversion timed out.",
  );

  if (exitCode !== 0) {
    throw new Error(
      "Could not convert this iPhone video. Export as MP4 from Photos and try again.",
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

export async function prepareVideoForWebUpload(
  file: File,
  onProgress?: (message: string) => void,
): Promise<File> {
  if (!needsWebTranscode(file)) {
    return file;
  }

  try {
    return await transcodeToMp4(file, onProgress);
  } catch (error) {
    console.warn("Client video transcode skipped:", error);
    onProgress?.("Uploading original video…");
    return file;
  }
}
