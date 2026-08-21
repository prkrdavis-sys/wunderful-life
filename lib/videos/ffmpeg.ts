import { toErrorMessage } from "@/lib/errors";
import { withTimeout } from "@/lib/videos/media-dom";

const FFMPEG_UMD =
  "https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js";
const FFMPEG_CORE_BASE =
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

const FFMPEG_LOAD_TIMEOUT_MS = 60_000;

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

export async function readFileBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function getFFmpeg(): Promise<FFmpegInstance> {
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

export function bytesFromFfmpegFile(data: Uint8Array | string): Uint8Array {
  return data instanceof Uint8Array
    ? new Uint8Array(data)
    : new TextEncoder().encode(data);
}

export function fileFromBytes(
  bytes: Uint8Array,
  name: string,
  type: string,
): File {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  return new File([buffer as ArrayBuffer], name, {
    type,
    lastModified: Date.now(),
  });
}
