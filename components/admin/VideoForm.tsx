"use client";

import { upload } from "@vercel/blob/client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Platform, PortfolioVideo } from "@/lib/videos/types";
import { PLATFORMS } from "@/lib/videos/types";
import { slugify } from "@/lib/videos/slugify";
import {
  isAcceptedVideoFile,
  uploadFilename,
  VIDEO_FILE_ACCEPT,
  VIDEO_UPLOAD_HELP,
  videoContentTypeFromFilename,
  videoUploadErrorMessage,
} from "@/lib/videos/upload";
import { needsWebTranscode, prepareVideoForWebUpload } from "@/lib/videos/transcode";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { FileUploadButton } from "@/components/ui/FileUploadButton";
import { UploadProgressBar } from "@/components/ui/UploadProgressBar";

type VideoFormProps = {
  initial?: PortfolioVideo | null;
  layout?: "default" | "panel";
  embedded?: boolean;
  onSuccess: (video: PortfolioVideo) => void;
  onCancel?: () => void;
  onUploadBusyChange?: (busy: boolean) => void;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown outline-none focus:border-burgundy/50";

type UploadConfig = {
  clientUpload: boolean;
  handleUploadUrl: string;
  directUploadLimitBytes: number;
};

type MediaUploadState = {
  status: "idle" | "preparing" | "uploading" | "ready" | "error";
  progress: number;
  message: string;
  url: string | null;
  error: string | null;
  useClientUpload: boolean;
};

const idleMediaUpload = (): MediaUploadState => ({
  status: "idle",
  progress: 0,
  message: "",
  url: null,
  error: null,
  useClientUpload: true,
});

async function readJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    if (response.status === 413) {
      throw new Error(
        "That file is too large for a direct upload. Try again — large videos upload through Blob storage automatically.",
      );
    }
    throw new Error(
      response.ok
        ? "The server returned an unexpected response."
        : `Upload failed (${response.status}). Please try again.`,
    );
  }
}

function uploadContentType(file: File, dir: "videos" | "thumbnails"): string | undefined {
  if (file.type) return file.type;
  if (dir === "videos") {
    return videoContentTypeFromFilename(file.name);
  }
  return undefined;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

function isMediaUploadBusy(state: MediaUploadState): boolean {
  return state.status === "preparing" || state.status === "uploading";
}

function isMediaBlockingSave(
  file: File | null,
  state: MediaUploadState,
  required: boolean,
): boolean {
  if (!file && !required) return false;
  if (!file && required) return true;
  if (!file) return false;
  if (state.status === "error") return true;
  if (state.status === "ready") return false;
  return true;
}

async function uploadAsset(
  file: File,
  dir: "videos" | "thumbnails",
  handleUploadUrl: string,
  onProgress?: (percentage: number) => void,
): Promise<string> {
  const pathname = uploadFilename(dir, file.name, crypto.randomUUID());
  const contentType = uploadContentType(file, dir);

  const result = await upload(pathname, file, {
    access: "public",
    handleUploadUrl,
    multipart: dir === "videos",
    ...(contentType ? { contentType } : {}),
    onUploadProgress: onProgress
      ? (event) => {
          onProgress(event.percentage);
        }
      : undefined,
  });
  return result.url;
}

const emptyForm = {
  title: "",
  brand: "",
  platform: "instagram" as Platform,
  hook: "",
  cta: "",
  durationSec: 0,
  tags: "",
  slug: "",
  featured: false,
};

export function VideoForm({
  initial,
  layout = "default",
  embedded = false,
  onSuccess,
  onCancel,
  onUploadBusyChange,
}: VideoFormProps) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          title: initial.title,
          brand: initial.brand,
          platform: initial.platform,
          hook: initial.hook,
          cta: initial.cta,
          durationSec: initial.durationSec,
          tags: initial.tags.join(", "),
          slug: initial.slug,
          featured: initial.featured,
        }
      : emptyForm,
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoUpload, setVideoUpload] = useState<MediaUploadState>(idleMediaUpload);
  const [thumbnailUpload, setThumbnailUpload] =
    useState<MediaUploadState>(idleMediaUpload);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Saving video details…");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const uploadConfigRef = useRef<UploadConfig | null>(null);
  const videoUploadGenRef = useRef(0);
  const thumbnailUploadGenRef = useRef(0);

  const uploadBusy =
    saving || isMediaUploadBusy(videoUpload) || isMediaUploadBusy(thumbnailUpload);

  useEffect(() => {
    onUploadBusyChange?.(uploadBusy);
  }, [onUploadBusyChange, uploadBusy]);

  useEffect(() => {
    return () => {
      videoUploadGenRef.current += 1;
      thumbnailUploadGenRef.current += 1;
      onUploadBusyChange?.(false);
    };
  }, [onUploadBusyChange]);

  useEffect(() => {
    if (!uploadBusy) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [uploadBusy]);

  const getUploadConfig = useCallback(async (): Promise<UploadConfig> => {
    if (uploadConfigRef.current) return uploadConfigRef.current;

    const response = await fetch("/api/videos/config");
    const config = await readJsonResponse<UploadConfig>(response);
    if (!response.ok) {
      throw new Error("Could not load upload settings.");
    }

    uploadConfigRef.current = config;
    return config;
  }, []);

  useEffect(() => {
    if (!initial) return;

    setForm({
      title: initial.title,
      brand: initial.brand,
      platform: initial.platform,
      hook: initial.hook,
      cta: initial.cta,
      durationSec: initial.durationSec,
      tags: initial.tags.join(", "),
      slug: initial.slug,
      featured: initial.featured,
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoUpload(idleMediaUpload());
    setThumbnailUpload(idleMediaUpload());
    setError(null);
    setMessage(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  }, [initial?.id]);

  const readVideoDuration = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const element = document.createElement("video");
    element.preload = "metadata";
    element.src = url;
    element.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      setForm((current) => ({
        ...current,
        durationSec: Math.round(element.duration) || current.durationSec,
      }));
    };
  }, []);

  const startVideoUpload = useCallback(
    async (file: File) => {
      const generation = ++videoUploadGenRef.current;

      setVideoUpload({
        status: "preparing",
        progress: 0,
        message: needsWebTranscode(file)
          ? "Converting iPhone video for web playback… (can take a minute)"
          : "Preparing video…",
        url: null,
        error: null,
        useClientUpload: true,
      });

      try {
        const config = await getUploadConfig();
        if (generation !== videoUploadGenRef.current) return;

        const prepared = await prepareVideoForWebUpload(file, (progressMessage) => {
          if (generation !== videoUploadGenRef.current) return;
          setVideoUpload((current) => ({
            ...current,
            status: "preparing",
            message: progressMessage,
          }));
        });

        if (generation !== videoUploadGenRef.current) return;

        if (!config.clientUpload) {
          setVideoUpload({
            status: "ready",
            progress: 100,
            message: "Video ready — will upload when you save",
            url: null,
            error: null,
            useClientUpload: false,
          });
          return;
        }

        setVideoUpload({
          status: "uploading",
          progress: 0,
          message: "Uploading video… 0%",
          url: null,
          error: null,
          useClientUpload: true,
        });

        const url = await uploadAsset(
          prepared,
          "videos",
          config.handleUploadUrl,
          (percentage) => {
            if (generation !== videoUploadGenRef.current) return;
            const rounded = Math.round(percentage);
            setVideoUpload((current) => ({
              ...current,
              status: "uploading",
              progress: rounded,
              message: `Uploading video… ${rounded}%`,
            }));
          },
        );

        if (generation !== videoUploadGenRef.current) return;

        setVideoUpload({
          status: "ready",
          progress: 100,
          message: "Video ready — fill in details and save",
          url,
          error: null,
          useClientUpload: true,
        });
      } catch (err) {
        if (generation !== videoUploadGenRef.current) return;
        const uploadError = toErrorMessage(err, "Video upload failed.");
        setVideoUpload({
          status: "error",
          progress: 0,
          message: uploadError,
          url: null,
          error: uploadError,
          useClientUpload: true,
        });
        setError(uploadError);
      }
    },
    [getUploadConfig],
  );

  const startThumbnailUpload = useCallback(
    async (file: File) => {
      const generation = ++thumbnailUploadGenRef.current;

      setThumbnailUpload({
        status: "preparing",
        progress: 0,
        message: "Preparing thumbnail…",
        url: null,
        error: null,
        useClientUpload: true,
      });

      try {
        const config = await getUploadConfig();
        if (generation !== thumbnailUploadGenRef.current) return;

        if (!config.clientUpload) {
          setThumbnailUpload({
            status: "ready",
            progress: 100,
            message: "Thumbnail ready — will upload when you save",
            url: null,
            error: null,
            useClientUpload: false,
          });
          return;
        }

        setThumbnailUpload({
          status: "uploading",
          progress: 0,
          message: "Uploading thumbnail… 0%",
          url: null,
          error: null,
          useClientUpload: true,
        });

        const url = await uploadAsset(
          file,
          "thumbnails",
          config.handleUploadUrl,
          (percentage) => {
            if (generation !== thumbnailUploadGenRef.current) return;
            const rounded = Math.round(percentage);
            setThumbnailUpload((current) => ({
              ...current,
              status: "uploading",
              progress: rounded,
              message: `Uploading thumbnail… ${rounded}%`,
            }));
          },
        );

        if (generation !== thumbnailUploadGenRef.current) return;

        setThumbnailUpload({
          status: "ready",
          progress: 100,
          message: "Thumbnail ready",
          url,
          error: null,
          useClientUpload: true,
        });
      } catch (err) {
        if (generation !== thumbnailUploadGenRef.current) return;
        const uploadError = toErrorMessage(err, "Thumbnail upload failed.");
        setThumbnailUpload({
          status: "error",
          progress: 0,
          message: uploadError,
          url: null,
          error: uploadError,
          useClientUpload: true,
        });
        setError(uploadError);
      }
    },
    [getUploadConfig],
  );

  const saveBlocked =
    isMediaBlockingSave(videoFile, videoUpload, !initial) ||
    isMediaBlockingSave(thumbnailFile, thumbnailUpload, !initial);

  const save = async () => {
    if (saveBlocked) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    setSaveMessage("Saving video details…");

    const payload = new FormData();
    payload.set("title", form.title);
    payload.set("brand", form.brand);
    payload.set("platform", form.platform);
    payload.set("hook", form.hook);
    payload.set("cta", form.cta);
    payload.set("durationSec", String(form.durationSec));
    payload.set("tags", form.tags);
    payload.set("slug", form.slug || slugify(form.title));
    payload.set("featured", String(form.featured));

    try {
      if (videoFile) {
        if (videoUpload.url) {
          payload.set("videoUrl", videoUpload.url);
        } else if (!videoUpload.useClientUpload) {
          payload.set("video", videoFile);
        }
      }

      if (thumbnailFile) {
        if (thumbnailUpload.url) {
          payload.set("thumbnailUrl", thumbnailUpload.url);
        } else if (!thumbnailUpload.useClientUpload) {
          payload.set("thumbnail", thumbnailFile);
        }
      }

      const url = initial ? `/api/videos/${initial.id}` : "/api/videos";
      const method = initial ? "PATCH" : "POST";
      const response = await fetch(url, { method, body: payload });
      const data = await readJsonResponse<{ error?: string } & PortfolioVideo>(
        response,
      );

      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      if (layout === "panel") {
        const saved = data as PortfolioVideo;
        setForm({
          title: saved.title,
          brand: saved.brand,
          platform: saved.platform,
          hook: saved.hook,
          cta: saved.cta,
          durationSec: saved.durationSec,
          tags: saved.tags.join(", "),
          slug: saved.slug,
          featured: saved.featured,
        });
        setVideoFile(null);
        setThumbnailFile(null);
        setVideoUpload(idleMediaUpload());
        setThumbnailUpload(idleMediaUpload());
        if (videoInputRef.current) videoInputRef.current.value = "";
        setMessage("Saved.");
        onSuccess(saved);
        return;
      }

      onSuccess(data as PortfolioVideo);
      if (!initial) {
        setForm(emptyForm);
        setVideoFile(null);
        setThumbnailFile(null);
        setVideoUpload(idleMediaUpload());
        setThumbnailUpload(idleMediaUpload());
        if (videoInputRef.current) videoInputRef.current.value = "";
      }
    } catch (err) {
      setError(toErrorMessage(err, "Failed to save video."));
    } finally {
      setSaving(false);
    }
  };

  const mediaProgress = (
    <div className="space-y-3 sm:col-span-2">
      {videoFile && videoUpload.status !== "idle" && (
        <UploadProgressBar
          label="Video"
          message={videoUpload.message}
          progress={videoUpload.progress}
          indeterminate={videoUpload.status === "preparing"}
        />
      )}
      {thumbnailFile && thumbnailUpload.status !== "idle" && (
        <UploadProgressBar
          label="Thumbnail"
          message={thumbnailUpload.message}
          progress={thumbnailUpload.progress}
          indeterminate={thumbnailUpload.status === "preparing"}
        />
      )}
    </div>
  );

  const fields = (
    <div className="grid gap-4 sm:grid-cols-2">
      {(
        [
          ["title", "Title", "text"],
          ["brand", "Brand", "text"],
          ["hook", "Hook", "text"],
          ["cta", "CTA", "text"],
          ["tags", "Tags (comma-separated)", "text"],
          ["slug", "Slug (optional)", "text"],
        ] as const
      ).map(([key, label, type]) => (
        <label key={key} className="block text-sm">
          <span className="text-muted">{label}</span>
          <input
            type={type}
            value={form[key]}
            onChange={(event) =>
              setForm((current) => ({ ...current, [key]: event.target.value }))
            }
            className={inputClass}
            required={key === "title" || key === "brand"}
          />
        </label>
      ))}

      <label className="block text-sm">
        <span className="text-muted">Platform</span>
        <select
          value={form.platform}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              platform: event.target.value as Platform,
            }))
          }
          className={inputClass}
        >
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-muted">Duration (seconds)</span>
        <input
          type="number"
          min={0}
          value={form.durationSec}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              durationSec: Number(event.target.value),
            }))
          }
          className={inputClass}
        />
      </label>

      <div className="block text-sm sm:col-span-2">
        <span className="text-muted">
          Video file {initial ? "(leave empty to keep current)" : ""}
        </span>
        <FileUploadButton
          className="mt-1"
          kind="video"
          inputRef={videoInputRef}
          accept={VIDEO_FILE_ACCEPT}
          hint={VIDEO_UPLOAD_HELP}
          selectedName={videoFile?.name}
          required={!initial}
          disabled={isMediaUploadBusy(videoUpload)}
          onChange={(file) => {
            if (file && !isAcceptedVideoFile(file)) {
              setVideoFile(null);
              setVideoUpload(idleMediaUpload());
              setError(videoUploadErrorMessage());
              if (videoInputRef.current) videoInputRef.current.value = "";
              return;
            }
            setError(null);
            setVideoFile(file);
            if (file) {
              readVideoDuration(file);
              void startVideoUpload(file);
            } else {
              videoUploadGenRef.current += 1;
              setVideoUpload(idleMediaUpload());
            }
          }}
        />
      </div>

      <div className="block text-sm sm:col-span-2">
        <span className="text-muted">
          Thumbnail {initial ? "(leave empty to keep current)" : ""}
        </span>
        <FileUploadButton
          className="mt-1"
          kind="thumbnail"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          selectedName={thumbnailFile?.name}
          required={!initial}
          disabled={isMediaUploadBusy(thumbnailUpload)}
          onChange={(file) => {
            setThumbnailFile(file);
            if (file) {
              void startThumbnailUpload(file);
            } else {
              thumbnailUploadGenRef.current += 1;
              setThumbnailUpload(idleMediaUpload());
            }
          }}
        />
      </div>

      {mediaProgress}

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(event) =>
            setForm((current) => ({ ...current, featured: event.target.checked }))
          }
          className="h-4 w-4 rounded border-brown/30"
        />
        <span className="text-muted">Featured on landing marquee</span>
      </label>
    </div>
  );

  const saveFooter = (
    <>
      {error && (
        <p className="mb-2 rounded-xl bg-pink/15 px-4 py-2 text-sm text-brown">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-2 rounded-xl bg-lavender/25 px-4 py-2 text-sm text-indigo">
          {message}
        </p>
      )}

      <AnimatedButton
        onClick={() => void save()}
        disabled={uploadBusy || saveBlocked}
        className="w-full shadow-md shadow-burgundy/15 sm:max-w-xs"
      >
        {saving
          ? saveMessage
          : saveBlocked
            ? "Waiting for uploads…"
            : initial
              ? "Save video"
              : "Add video"}
      </AnimatedButton>
    </>
  );

  if (layout === "panel" && embedded) {
    return (
      <div className="space-y-4">
        {fields}
        <div className="border-t border-brown/10 pt-4">{saveFooter}</div>
      </div>
    );
  }

  if (layout === "panel") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-brown/10 px-4 pb-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg text-brown">
                {initial ? "Edit video" : "Add video"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {initial?.title ??
                  "Pick your video and thumbnail first — they upload while you fill in the details."}
              </p>
            </div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-brown/20 px-3 py-1.5 text-sm text-brown hover:bg-cream"
              >
                Back
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {fields}
        </div>

        <div className="shrink-0 border-t border-brown/10 bg-paper px-4 py-3 sm:px-6">
          {saveFooter}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="rounded-3xl border-2 border-lavender/35 bg-white/80 p-6 backdrop-blur-sm"
    >
      <h2 className="font-display text-xl text-brown">Add New Video</h2>
      <p className="mt-1 text-sm text-muted">
        Files upload as soon as you pick them. Save when both are ready.
      </p>

      <div className="mt-6">{fields}</div>

      {error && (
        <p className="mt-4 rounded-xl bg-pink/20 px-4 py-2 text-sm text-brown">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <AnimatedButton type="submit" disabled={uploadBusy || saveBlocked}>
          {saving
            ? saveMessage
            : saveBlocked
              ? "Waiting for uploads…"
              : "Add Video"}
        </AnimatedButton>
      </div>
    </form>
  );
}
