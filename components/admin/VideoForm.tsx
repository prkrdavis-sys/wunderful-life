"use client";

import { upload } from "@vercel/blob/client";
import { useCallback, useRef, useState } from "react";
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
import { AnimatedButton } from "@/components/ui/AnimatedButton";

type VideoFormProps = {
  initial?: PortfolioVideo | null;
  onSuccess: (video: PortfolioVideo) => void;
  onCancel?: () => void;
};

type UploadConfig = {
  clientUpload: boolean;
  handleUploadUrl: string;
};

async function uploadAsset(
  file: File,
  dir: "videos" | "thumbnails",
  handleUploadUrl: string,
): Promise<string> {
  const pathname = uploadFilename(dir, file.name, crypto.randomUUID());
  const result = await upload(pathname, file, {
    access: "public",
    handleUploadUrl,
    multipart: dir === "videos",
    contentType:
      dir === "videos"
        ? file.type || videoContentTypeFromFilename(file.name)
        : file.type || undefined,
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

export function VideoForm({ initial, onSuccess, onCancel }: VideoFormProps) {
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
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Saving…");
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setLoadingMessage("Saving…");

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
      const configResponse = await fetch("/api/videos/config");
      const config = (await configResponse.json()) as UploadConfig;

      if (config.clientUpload) {
        if (videoFile) {
          setLoadingMessage("Uploading video…");
          payload.set(
            "videoUrl",
            await uploadAsset(videoFile, "videos", config.handleUploadUrl),
          );
        }
        if (thumbnailFile) {
          setLoadingMessage("Uploading thumbnail…");
          payload.set(
            "thumbnailUrl",
            await uploadAsset(thumbnailFile, "thumbnails", config.handleUploadUrl),
          );
        }
      } else {
        if (videoFile) payload.set("video", videoFile);
        if (thumbnailFile) payload.set("thumbnail", thumbnailFile);
      }

      setLoadingMessage("Saving…");
      const url = initial ? `/api/videos/${initial.id}` : "/api/videos";
      const method = initial ? "PATCH" : "POST";
      const response = await fetch(url, { method, body: payload });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      onSuccess(data as PortfolioVideo);
      if (!initial) {
        setForm(emptyForm);
        setVideoFile(null);
        setThumbnailFile(null);
        if (videoInputRef.current) videoInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border-2 border-lavender/35 bg-white/80 p-6 backdrop-blur-sm"
    >
      <h2 className="font-display text-xl text-brown">
        {initial ? "Edit Video" : "Add New Video"}
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
            <span className="font-medium text-brown">{label}</span>
            <input
              type={type}
              value={form[key]}
              onChange={(event) =>
                setForm((current) => ({ ...current, [key]: event.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-brown/20 bg-cream px-3 py-2 text-brown outline-none focus:border-burgundy/50"
              required={key === "title" || key === "brand"}
            />
          </label>
        ))}

        <label className="block text-sm">
          <span className="font-medium text-brown">Platform</span>
          <select
            value={form.platform}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                platform: event.target.value as Platform,
              }))
            }
            className="mt-1 w-full rounded-xl border border-brown/20 bg-cream px-3 py-2 text-brown outline-none focus:border-burgundy/50"
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-brown">Duration (seconds)</span>
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
            className="mt-1 w-full rounded-xl border border-brown/20 bg-cream px-3 py-2 text-brown outline-none focus:border-burgundy/50"
          />
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-brown">
            Video file {initial ? "(leave empty to keep current)" : ""}
          </span>
          <input
            ref={videoInputRef}
            type="file"
            accept={VIDEO_FILE_ACCEPT}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (file && !isAcceptedVideoFile(file)) {
                setVideoFile(null);
                setError(videoUploadErrorMessage());
                event.target.value = "";
                return;
              }
              setError(null);
              setVideoFile(file);
              if (file) readVideoDuration(file);
            }}
            className="mt-1 block w-full text-sm text-muted"
            required={!initial}
          />
          <span className="mt-1 block text-xs text-muted">{VIDEO_UPLOAD_HELP}</span>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-brown">
            Thumbnail {initial ? "(leave empty to keep current)" : ""}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(event) =>
              setThumbnailFile(event.target.files?.[0] ?? null)
            }
            className="mt-1 block w-full text-sm text-muted"
            required={!initial}
          />
        </label>

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) =>
              setForm((current) => ({ ...current, featured: event.target.checked }))
            }
            className="h-4 w-4 rounded border-brown/30"
          />
          <span className="font-medium text-brown">Featured on landing marquee</span>
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-pink/20 px-4 py-2 text-sm text-brown">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <AnimatedButton type="submit" disabled={loading}>
          {loading ? loadingMessage : initial ? "Update Video" : "Add Video"}
        </AnimatedButton>
        {onCancel && (
          <AnimatedButton type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </AnimatedButton>
        )}
      </div>
    </form>
  );
}
