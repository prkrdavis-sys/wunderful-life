"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_COLLAGE_TILES,
  type AboutPhoto,
  type CollagePhotoShape,
  type SiteContent,
} from "@/lib/site/types";
import type { PortfolioVideo } from "@/lib/videos/types";
import {
  isAcceptedVideoFile,
  VIDEO_FILE_ACCEPT,
  VIDEO_UPLOAD_HELP,
  videoUploadErrorMessage,
} from "@/lib/videos/upload";
import { needsWebTranscode, prepareVideoForWebUpload } from "@/lib/videos/transcode";
import { extractVideoFrame } from "@/lib/videos/extractThumbnail";
import { isVercelBlobUrl } from "@/lib/storage/blob";
import { uploadMediaToStorage } from "@/lib/storage/client-upload";
import type { MediaUploadDir } from "@/lib/storage/media-upload";
import {
  preparePhotoForUpload,
  readUploadJson,
} from "@/lib/site/photos";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { FileUploadButton } from "@/components/ui/FileUploadButton";
import { UploadProgressBar } from "@/components/ui/UploadProgressBar";
import { VideoThumbnail } from "@/components/ui/VideoThumbnail";
import {
  useAdminView,
  type SiteEditorSection,
} from "@/components/admin/AdminViewProvider";
import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";

type SiteEditorFormProps = {
  onSaved?: (site: SiteContent) => void;
  portfolioVideos?: PortfolioVideo[];
  portfolioVideosLoaded?: boolean;
};

/** First two `about.photos` sit in About; the rest are the "A little more" gallery. */
const ABOUT_INTRO_PHOTO_COUNT = 2;

const SECTIONS: { id: SiteEditorSection; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "hero", label: "Hero" },
  { id: "stats", label: "Stats banner" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "work", label: "Videos" },
  { id: "ugc", label: "Why UGC" },
  { id: "brands", label: "Brands" },
  { id: "photography", label: "Photography" },
  { id: "testimonials", label: "Testimonials" },
  { id: "photos", label: "A little more" },
  { id: "cta", label: "Closing CTA" },
];

const inputClass =
  "mt-1 w-full min-w-0 rounded-xl border border-brown/20 bg-white px-3 py-2.5 leading-normal text-base text-brown";

const cardClass = "space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4";

const smallButtonClass =
  "rounded-lg border border-brown/25 bg-white px-2 py-1 text-xs font-medium text-brown transition hover:border-forest/45 hover:text-forest disabled:cursor-not-allowed disabled:opacity-40";

/** Move an item within a list, returning a new array. */
function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function uniqueId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Reorder / remove controls shared by every repeatable list row. */
function RowControls({
  label,
  index,
  count,
  onMove,
  onRemove,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
        {label} {index + 1}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label={`Move ${label} ${index + 1} up`}
          className={smallButtonClass}
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === count - 1}
          aria-label={`Move ${label} ${index + 1} down`}
          className={smallButtonClass}
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} ${index + 1}`}
          className={`${smallButtonClass} hover:border-blush-deep/60 hover:text-blush-deep`}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function AddRowButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-dashed border-forest/40 px-4 py-2 text-sm font-medium text-forest transition hover:bg-forest/5 disabled:cursor-not-allowed disabled:border-brown/20 disabled:bg-cream/40 disabled:text-muted disabled:hover:bg-cream/40"
    >
      + {label}
    </button>
  );
}

function withAboutPhoto(
  site: SiteContent,
  index: number,
  patch: Partial<Pick<AboutPhoto, "caption" | "rotate">>,
): SiteContent {
  const current = site.about.photos[index];
  if (!current) return site;
  const photos = [...site.about.photos];
  photos[index] = { ...current, ...patch };
  return {
    ...site,
    about: { ...site.about, photos },
  };
}

function AboutPhotoEditorCard({
  photo,
  heading,
  loading,
  onCaptionChange,
  onRotateChange,
  onUpload,
  onRemove,
}: {
  photo: AboutPhoto;
  heading: string;
  loading: boolean;
  onCaptionChange: (caption: string) => void;
  onRotateChange: (rotate: number) => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4">
      <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
        {heading}
      </p>
      <label className="block text-sm">
        <span className="text-muted">Caption</span>
        <AutoResizeTextarea
          value={photo.caption}
          onChange={(event) => onCaptionChange(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Rotate (deg)</span>
        <input
          type="number"
          value={photo.rotate}
          onChange={(event) => onRotateChange(Number(event.target.value))}
          className={inputClass}
        />
      </label>
      <div className="block text-sm">
        <span className="text-muted">Photo</span>
        <FileUploadButton
          className="mt-1"
          kind="photo"
          accept="image/*"
          selectedName={photo.imagePath}
          previewUrl={photo.imagePath}
          disabled={loading}
          onChange={(file) => {
            if (file) onUpload(file);
          }}
          onRemove={photo.imagePath ? onRemove : undefined}
        />
        {photo.imagePath && (
          <p className="mt-2 flex max-w-full items-start gap-1.5 rounded-full bg-lavender/35 px-2.5 py-1 text-xs font-medium break-words text-ink">
            <span aria-hidden>🌸</span>
            Live on your site
          </p>
        )}
      </div>
    </div>
  );
}

type VideoSlot = "hero" | "cta";

type VideoUploadState = {
  status: "idle" | "preparing" | "uploading" | "ready" | "error";
  progress: number;
  message: string;
};

const idleVideoUpload = (): VideoUploadState => ({
  status: "idle",
  progress: 0,
  message: "",
});

const SLOT_COPY: Record<VideoSlot, { noun: string; endpoint: string }> = {
  hero: { noun: "hero video", endpoint: "/api/site/hero-video" },
  cta: { noun: "CTA video", endpoint: "/api/site/cta-video" },
};

function videoDisplayName(path: string): string {
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const segment = new URL(path).pathname.split("/").pop();
      return segment || path;
    }
  } catch {
    // fall through
  }
  return path.split("/").pop() || path;
}

export function SiteEditorForm({
  onSaved,
  portfolioVideos = [],
  portfolioVideosLoaded = false,
}: SiteEditorFormProps) {
  const {
    site,
    setSite,
    editorSection,
    setEditorSection,
    editorFocus,
    clearEditorFocus,
    openPortfolioEditor,
    siteVersion,
    setSiteVersion,
  } = useAdminView();
  const [form, setForm] = useState(site);
  const [section, setSection] = useState<SiteEditorSection>("profile");
  const activeSection = editorSection ?? section;
  const sectionNavRefs = useRef<
    Partial<Record<SiteEditorSection, HTMLButtonElement | null>>
  >({});
  const photoCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [videoFiles, setVideoFiles] = useState<Record<VideoSlot, File | null>>({
    hero: null,
    cta: null,
  });
  const [videoUploads, setVideoUploads] = useState<
    Record<VideoSlot, VideoUploadState>
  >({
    hero: idleVideoUpload(),
    cta: idleVideoUpload(),
  });
  const videoUploadGenRef = useRef<Record<VideoSlot, number>>({ hero: 0, cta: 0 });
  const heroVideoInputRef = useRef<HTMLInputElement>(null);
  const ctaVideoInputRef = useRef<HTMLInputElement>(null);
  const focusedPhotoId =
    editorFocus?.kind === "photography-photo" ? editorFocus.photoId : null;

  const isBusy = (state: VideoUploadState) =>
    state.status === "preparing" || state.status === "uploading";
  const uploadBusy = isBusy(videoUploads.hero) || isBusy(videoUploads.cta);

  const responseVersion = (response: Response): number => {
    const version = Number(response.headers.get("x-site-version"));
    if (!Number.isSafeInteger(version) || version < 1) {
      throw new Error("The server did not confirm the saved site version.");
    }
    return version;
  };

  const refreshAfterConflict = async () => {
    const latestResponse = await fetch("/api/site", { cache: "no-store" });
    const latest = await readUploadJson<SiteContent>(latestResponse);
    setSite(latest);
    setSiteVersion(responseVersion(latestResponse));
    setError(
      "This change was not applied because the site changed elsewhere. Your edits are still here; review them against the latest site and try again.",
    );
  };

  const videoPreviewUrls = useMemo(
    () => ({
      hero: videoFiles.hero ? URL.createObjectURL(videoFiles.hero) : null,
      cta: videoFiles.cta ? URL.createObjectURL(videoFiles.cta) : null,
    }),
    [videoFiles],
  );

  useEffect(() => {
    return () => {
      for (const url of Object.values(videoPreviewUrls)) {
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, [videoPreviewUrls]);

  useEffect(() => {
    // Bumping the generations on unmount abandons any in-flight upload.
    const generations = videoUploadGenRef.current;
    return () => {
      generations.hero += 1;
      generations.cta += 1;
    };
  }, []);

  useEffect(() => {
    if (!uploadBusy) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [uploadBusy]);

  useEffect(() => {
    const navItem = sectionNavRefs.current[activeSection];
    navItem?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "photography" || !focusedPhotoId) return;

    const frame = window.requestAnimationFrame(() => {
      sectionNavRefs.current.photography?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      photoCardRefs.current[focusedPhotoId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeSection, focusedPhotoId]);

  const setSlotUpload = (slot: VideoSlot, state: VideoUploadState) =>
    setVideoUploads((current) => ({ ...current, [slot]: state }));

  const patchSlotUpload = (
    slot: VideoSlot,
    patch: Partial<VideoUploadState>,
  ) =>
    setVideoUploads((current) => ({
      ...current,
      [slot]: { ...current[slot], ...patch },
    }));

  const startVideoUpload = async (slot: VideoSlot, file: File) => {
    const generation = ++videoUploadGenRef.current[slot];
    const version = siteVersion;
    const { noun, endpoint } = SLOT_COPY[slot];
    setError(null);
    setMessage(null);
    setSlotUpload(slot, {
      status: "preparing",
      progress: 0,
      message: needsWebTranscode(file, slot)
        ? "Compressing video for the web… (can take a minute)"
        : "Preparing video…",
    });

    try {
      const preparedPromise = prepareVideoForWebUpload(file, {
        profile: slot,
        onProgress: (progressMessage) => {
          if (generation !== videoUploadGenRef.current[slot]) return;
          patchSlotUpload(slot, { status: "preparing", message: progressMessage });
        },
      });
      const configResponse = await fetch("/api/videos/config");
      const config = (await configResponse.json()) as {
        clientUpload: boolean;
        handleUploadUrl: string;
      };
      if (!configResponse.ok) {
        throw new Error("Could not load upload settings.");
      }
      const prepared = await preparedPromise;
      if (generation !== videoUploadGenRef.current[slot]) return;

      let posterFile: File | null = null;
      if (slot === "hero") {
        patchSlotUpload(slot, {
          status: "preparing",
          message: "Capturing a still so the hero can appear instantly…",
        });
        try {
          posterFile = await extractVideoFrame(prepared, {
            mimeType: "image/jpeg",
            quality: 0.72,
          });
        } catch (error) {
          console.warn("Hero poster capture skipped:", error);
        }
        if (generation !== videoUploadGenRef.current[slot]) return;
      }

      const payload = new FormData();

      if (config.clientUpload) {
        setSlotUpload(slot, {
          status: "uploading",
          progress: 0,
          message: `Uploading ${noun}… 0%`,
        });

        const videoUrl = await uploadMediaToStorage(
          prepared,
          slot,
          config.handleUploadUrl,
          (percentage) => {
            if (generation !== videoUploadGenRef.current[slot]) return;
            patchSlotUpload(slot, {
              status: "uploading",
              progress: percentage,
              message: `Uploading ${noun}… ${percentage}%`,
            });
          },
        );
        if (generation !== videoUploadGenRef.current[slot]) return;
        payload.set("videoUrl", videoUrl);
        if (posterFile) {
          const posterUrl = await uploadMediaToStorage(
            posterFile,
            slot,
            config.handleUploadUrl,
          );
          if (generation !== videoUploadGenRef.current[slot]) return;
          payload.set("posterUrl", posterUrl);
        }
      } else {
        setSlotUpload(slot, {
          status: "uploading",
          progress: 0,
          message: `Uploading ${noun}…`,
        });
        payload.set("video", prepared);
        if (posterFile) payload.set("poster", posterFile);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "X-Site-Version": String(version) },
        body: payload,
      });
      const data = await response.json();
      if (generation !== videoUploadGenRef.current[slot]) return;

      if (!response.ok) {
        if (response.status === 409) {
          await refreshAfterConflict();
          throw new Error("The upload was not applied because the site changed.");
        }
        throw new Error(data.error ?? `Failed to upload ${noun}.`);
      }

      setForm(data);
      setSite(data);
      setSiteVersion(responseVersion(response));
      setVideoFiles((current) => ({ ...current, [slot]: null }));
      const inputRef = slot === "hero" ? heroVideoInputRef : ctaVideoInputRef;
      if (inputRef.current) inputRef.current.value = "";
      setSlotUpload(slot, {
        status: "ready",
        progress: 100,
        message: `Already on your site — no need to press Save.`,
      });
      setMessage(
        `${noun[0].toUpperCase()}${noun.slice(1)} is on your site now — no need to press Save.`,
      );
    } catch (err) {
      if (generation !== videoUploadGenRef.current[slot]) return;
      const uploadError =
        err instanceof Error && err.message
          ? err.message
          : `${noun} upload failed.`;
      setSlotUpload(slot, { status: "error", progress: 0, message: uploadError });
      setError(uploadError);
    }
  };

  const save = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/site", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Site-Version": String(siteVersion),
        },
        body: JSON.stringify(form),
      });
      const data = await readUploadJson<SiteContent & { error?: string }>(response);

      if (!response.ok) {
        if (response.status === 409) {
          await refreshAfterConflict();
          return;
        }
        throw new Error(data.error ?? "Failed to save.");
      }

      setSite(data);
      setForm(data);
      setSiteVersion(responseVersion(response));
      onSaved?.(data);
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const PHOTO_ENDPOINTS = {
    about: "/api/site/photos",
    collage: "/api/site/collage-photos",
    brandLogo: "/api/site/brand-logos",
  } as const;

  const PHOTO_FOLDERS: Record<keyof typeof PHOTO_ENDPOINTS, MediaUploadDir> = {
    about: "about-photos",
    collage: "home-grid-photos",
    brandLogo: "brand-logos",
  };

  const uploadPhoto = async (
    photoId: string,
    file: File,
    kind: keyof typeof PHOTO_ENDPOINTS = "about",
  ) => {
    const version = siteVersion;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const prepared = await preparePhotoForUpload(file, {
        preferJpeg: kind !== "brandLogo",
        maxEdge: kind === "brandLogo" ? 800 : 1920,
      });
      const payload = new FormData();
      const endpoint = `${PHOTO_ENDPOINTS[kind]}/${photoId}`;

      const configResponse = await fetch("/api/videos/config");
      const config = await readUploadJson<{
        clientUpload: boolean;
        handleUploadUrl: string;
      }>(configResponse);
      if (!configResponse.ok) {
        throw new Error("Could not load upload settings.");
      }

      if (config.clientUpload) {
        const imageUrl = await uploadMediaToStorage(
          prepared,
          PHOTO_FOLDERS[kind],
          config.handleUploadUrl,
        );
        payload.set("imageUrl", imageUrl);
      } else {
        payload.set("photo", prepared);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "X-Site-Version": String(version) },
        body: payload,
      });
      const data = await readUploadJson<SiteContent & { error?: string }>(response);

      if (!response.ok) {
        if (response.status === 409) {
          await refreshAfterConflict();
          throw new Error("The upload was not applied because the site changed.");
        }
        throw new Error(data.error ?? "Failed to upload photo.");
      }

      setForm(data);
      setSite(data);
      setSiteVersion(responseVersion(response));
      setMessage("Photo uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async (
    photoId: string,
    kind: keyof typeof PHOTO_ENDPOINTS = "about",
  ) => {
    const version = siteVersion;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const endpoint = `${PHOTO_ENDPOINTS[kind]}/${photoId}`;
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "X-Site-Version": String(version) },
      });
      const data = await readUploadJson<SiteContent & { error?: string }>(response);

      if (!response.ok) {
        if (response.status === 409) {
          await refreshAfterConflict();
          throw new Error("The removal was not applied because the site changed.");
        }
        throw new Error(data.error ?? "Failed to remove photo.");
      }

      setForm(data);
      setSite(data);
      setSiteVersion(responseVersion(response));
      setMessage(kind === "brandLogo" ? "Logo removed." : "Photo removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove photo.");
    } finally {
      setLoading(false);
    }
  };

  const removeVideo = async (slot: VideoSlot) => {
    const { noun, endpoint } = SLOT_COPY[slot];
    const hadPending = Boolean(videoFiles[slot]);
    const version = siteVersion;

    videoUploadGenRef.current[slot] += 1;
    setVideoFiles((current) => ({ ...current, [slot]: null }));
    setSlotUpload(slot, idleVideoUpload());
    const inputRef = slot === "hero" ? heroVideoInputRef : ctaVideoInputRef;
    if (inputRef.current) inputRef.current.value = "";

    // Cancelling a pending swap keeps the live video in place.
    if (hadPending) {
      setError(null);
      setMessage(null);
      return;
    }

    const livePath =
      slot === "hero" ? form.hero.videoPath : form.closingCta.videoPath;
    if (!livePath) {
      setError(null);
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "X-Site-Version": String(version) },
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          await refreshAfterConflict();
          throw new Error(`The ${noun} removal was not applied because the site changed.`);
        }
        throw new Error(data.error ?? `Failed to remove ${noun}.`);
      }

      setForm(data);
      setSite(data);
      setSiteVersion(responseVersion(response));
      setMessage(`${noun[0].toUpperCase()}${noun.slice(1)} removed.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to remove ${noun}.`,
      );
    } finally {
      setLoading(false);
    }
  };

  /** Ids present in the saved content; uploads need a persisted row to target. */
  const savedCollageIds = new Set(site.photography.photos.map((photo) => photo.id));
  const savedBrandIds = new Set(site.brands.items.map((brand) => brand.id));
  const featuredPortfolioVideos = portfolioVideos.filter((video) => video.featured);
  const marqueeVideos =
    featuredPortfolioVideos.length > 0
      ? featuredPortfolioVideos
      : portfolioVideos;

  const renderVideoUpload = (slot: VideoSlot, videoPath: string | undefined) => {
    const state = videoUploads[slot];
    const busy = isBusy(state);
    const inputRef = slot === "hero" ? heroVideoInputRef : ctaVideoInputRef;
    const { noun } = SLOT_COPY[slot];

    return (
      <>
        <FileUploadButton
          kind="video"
          inputRef={inputRef}
          accept={VIDEO_FILE_ACCEPT}
          hint={VIDEO_UPLOAD_HELP}
          selectedName={
            videoFiles[slot]?.name ??
            (videoPath ? videoDisplayName(videoPath) : null)
          }
          previewUrl={videoPreviewUrls[slot] ?? videoPath ?? null}
          previewType="video"
          disabled={busy || loading}
          buttonLabel={videoPath ? "Swap video" : "Add a video"}
          onChange={(file) => {
            if (!file) return;
            if (!isAcceptedVideoFile(file)) {
              setVideoFiles((current) => ({ ...current, [slot]: null }));
              setSlotUpload(slot, idleVideoUpload());
              setError(videoUploadErrorMessage());
              if (inputRef.current) inputRef.current.value = "";
              return;
            }
            setError(null);
            setVideoFiles((current) => ({ ...current, [slot]: file }));
            void startVideoUpload(slot, file);
          }}
          onRemove={() => {
            void removeVideo(slot);
          }}
        />
        {state.status !== "idle" && (
          <UploadProgressBar
            label={noun}
            message={state.message}
            progress={state.progress}
            indeterminate={state.status === "preparing"}
          />
        )}
        {videoPath && !busy && (
          <p className="flex max-w-full items-start gap-1.5 rounded-full bg-lavender/35 px-2.5 py-1 text-xs font-medium break-words text-ink">
            <span aria-hidden>🌸</span>
            {isVercelBlobUrl(videoPath)
              ? "Stored on the old host — re-upload to keep this video cheap to play"
              : "Live on your site — no Save needed"}
          </p>
        )}
      </>
    );
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
      <nav
        aria-label="Site content sections"
        className="max-w-full shrink-0 border-b border-brown/10 bg-cream/40 md:w-52 md:max-w-none md:border-r md:border-b-0 lg:w-56"
      >
        <div className="flex max-w-full gap-1 overflow-x-auto overscroll-x-contain px-3 py-2 md:flex-col md:gap-0.5 md:overflow-visible md:px-3 md:py-4">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setEditorSection(null);
                clearEditorFocus();
                setSection(item.id);
              }}
              ref={(element) => {
                sectionNavRefs.current[item.id] = element;
              }}
              className={`shrink-0 rounded-xl px-3 py-2 text-left text-sm font-medium transition md:w-full md:px-3 md:py-2.5 ${
                activeSection === item.id
                  ? "bg-forest text-paper"
                  : "text-ink hover:bg-white/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-5">
          {activeSection === "profile" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Profile</h3>
                <p className="mt-1 text-sm text-muted">
                  How Emily appears in the hero and across the site.
                </p>
              </div>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="text-muted">Full name</span>
                  <AutoResizeTextarea
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-muted">First name</span>
                  <AutoResizeTextarea
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-muted">Brand</span>
                  <AutoResizeTextarea
                    value={form.brand}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        brand: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="text-muted">
                    Tagline (used for search/social previews — the hero shows the
                    Hero subtitle instead)
                  </span>
                  <AutoResizeTextarea
                    value={form.tagline}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tagline: event.target.value,
                      }))
                    }
                    rows={2}
                    className={inputClass}
                  />
                </label>
              </div>
            </section>
          )}

          {activeSection === "hero" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Hero</h3>
                <p className="mt-1 text-sm text-muted">
                  The full-width background video at the top of the home page,
                  plus the cursive subtitle shown at the bottom of the hero.
                </p>
              </div>

              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Subtitle (cursive line)</span>
                <AutoResizeTextarea
                  value={form.hero.subtitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      hero: { ...current.hero, subtitle: event.target.value },
                    }))
                  }
                  rows={3}
                  className={inputClass}
                />
                <span className="mt-1 block text-xs text-muted">
                  Remember to press &ldquo;Save site content&rdquo; after editing
                  the subtitle.
                </span>
              </label>

              <div className="max-w-2xl space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4">
                <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Background video
                </p>
                <p className="text-sm text-muted">
                  Goes live as soon as you pick a file — no need to press
                  &ldquo;Save site content&rdquo;. Replaces the current video.
                  Without a video, the hero shows the plant wallpaper.
                </p>
                {renderVideoUpload("hero", form.hero.videoPath)}
              </div>
            </section>
          )}

          {activeSection === "stats" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Stats banner</h3>
                <p className="mt-1 text-sm text-muted">
                  The band directly under the hero video. Add as many figures as
                  you like — they spread evenly across the banner.
                </p>
              </div>

              <label className="flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-brown/15 bg-cream/55 p-4 text-sm">
                <span>
                  <span className="block font-semibold text-brown">
                    Show the stats banner
                  </span>
                  <span className="mt-1 block text-muted">
                    Admin view still previews it while hidden.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.statsBanner.visible}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      statsBanner: {
                        ...current.statsBanner,
                        visible: event.target.checked,
                      },
                    }))
                  }
                  className="h-5 w-5 accent-forest"
                />
              </label>

              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {form.statsBanner.items.map((stat, index) => (
                  <div key={stat.id} className={cardClass}>
                    <RowControls
                      label="Stat"
                      index={index}
                      count={form.statsBanner.items.length}
                      onMove={(delta) =>
                        setForm((current) => ({
                          ...current,
                          statsBanner: {
                            ...current.statsBanner,
                            items: moveItem(
                              current.statsBanner.items,
                              index,
                              delta,
                            ),
                          },
                        }))
                      }
                      onRemove={() =>
                        setForm((current) => ({
                          ...current,
                          statsBanner: {
                            ...current.statsBanner,
                            items: current.statsBanner.items.filter(
                              (_, i) => i !== index,
                            ),
                          },
                        }))
                      }
                    />
                    <label className="block text-sm">
                      <span className="text-muted">Figure (cursive)</span>
                      <AutoResizeTextarea
                        value={stat.value}
                        onChange={(event) =>
                          setForm((current) => {
                            const items = [...current.statsBanner.items];
                            items[index] = {
                              ...items[index],
                              value: event.target.value,
                            };
                            return {
                              ...current,
                              statsBanner: { ...current.statsBanner, items },
                            };
                          })
                        }
                        placeholder="10k"
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Label</span>
                      <AutoResizeTextarea
                        value={stat.label}
                        onChange={(event) =>
                          setForm((current) => {
                            const items = [...current.statsBanner.items];
                            items[index] = {
                              ...items[index],
                              label: event.target.value,
                            };
                            return {
                              ...current,
                              statsBanner: { ...current.statsBanner, items },
                            };
                          })
                        }
                        placeholder="Instagram"
                        className={inputClass}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <AddRowButton
                label="Add stat"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    statsBanner: {
                      ...current.statsBanner,
                      items: [
                        ...current.statsBanner.items,
                        { id: uniqueId("stat"), value: "", label: "" },
                      ],
                    },
                  }))
                }
              />
            </section>
          )}

          {activeSection === "about" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">About copy</h3>
                <p className="mt-1 text-sm text-muted">
                  Headline and paragraphs for the About section.
                </p>
              </div>
              <label className="block text-sm">
                <span className="text-muted">Section headline</span>
                <AutoResizeTextarea
                  value={form.about.headline}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      about: { ...current.about, headline: event.target.value },
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <div className="space-y-4">
                {form.about.paragraphs.map((paragraph, index) => (
                  <label key={`paragraph-${index}`} className="block text-sm">
                    <span className="text-muted">Paragraph {index + 1}</span>
                    <AutoResizeTextarea
                      value={paragraph}
                      onChange={(event) =>
                        setForm((current) => {
                          const paragraphs = [...current.about.paragraphs];
                          paragraphs[index] = event.target.value;
                          return {
                            ...current,
                            about: { ...current.about, paragraphs },
                          };
                        })
                      }
                      rows={8}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
              <div>
                <h3 className="font-display text-lg text-brown">About photos</h3>
                <p className="mt-1 text-sm text-muted">
                  Main portrait and accent photo for the About section.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {form.about.photos
                  .slice(0, ABOUT_INTRO_PHOTO_COUNT)
                  .map((photo, index) => (
                    <AboutPhotoEditorCard
                      key={photo.id}
                      photo={photo}
                      heading={index === 0 ? "Main photo" : "Accent photo"}
                      loading={loading}
                      onCaptionChange={(caption) =>
                        setForm((current) =>
                          withAboutPhoto(current, index, { caption }),
                        )
                      }
                      onRotateChange={(rotate) =>
                        setForm((current) =>
                          withAboutPhoto(current, index, { rotate }),
                        )
                      }
                      onUpload={(file) => {
                        void uploadPhoto(photo.id, file);
                      }}
                      onRemove={() => {
                        void removePhoto(photo.id);
                      }}
                    />
                  ))}
              </div>
            </section>
          )}

          {activeSection === "photos" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">A little more</h3>
                <p className="mt-1 text-sm text-muted">
                  Gallery photos below About. Upload images, captions, and
                  rotation for each photo.
                </p>
              </div>
              {form.about.photos.length <= ABOUT_INTRO_PHOTO_COUNT ? (
                <p className="text-sm text-muted">No gallery photos yet.</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {form.about.photos
                    .slice(ABOUT_INTRO_PHOTO_COUNT)
                    .map((photo, sliceIndex) => {
                      const index = sliceIndex + ABOUT_INTRO_PHOTO_COUNT;
                      return (
                        <AboutPhotoEditorCard
                          key={photo.id}
                          photo={photo}
                          heading={`Photo ${sliceIndex + 1}`}
                          loading={loading}
                          onCaptionChange={(caption) =>
                            setForm((current) =>
                              withAboutPhoto(current, index, { caption }),
                            )
                          }
                          onRotateChange={(rotate) =>
                            setForm((current) =>
                              withAboutPhoto(current, index, { rotate }),
                            )
                          }
                          onUpload={(file) => {
                            void uploadPhoto(photo.id, file);
                          }}
                          onRemove={() => {
                            void removePhoto(photo.id);
                          }}
                        />
                      );
                    })}
                </div>
              )}
            </section>
          )}

          {activeSection === "work" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Videos section</h3>
                <p className="mt-1 text-sm text-muted">
                  Phone carousel clips live in the Videos tab. Mark a video
                  “Show in carousel” to feature it there. If none are marked,
                  every uploaded clip appears. Below, edit the cursive section
                  title.
                </p>
              </div>

              <div className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                      Carousel videos
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Currently shown in the phone carousel
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openPortfolioEditor}
                    className="rounded-full border border-forest/30 bg-forest px-3 py-1.5 text-sm font-medium text-paper transition hover:bg-forest-deep"
                  >
                    Manage videos
                  </button>
                </div>

                {!portfolioVideosLoaded ? (
                  <p className="text-sm text-muted">Loading uploaded videos…</p>
                ) : portfolioVideos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-brown/20 bg-white/60 px-4 py-6 text-center">
                    <p className="text-sm text-muted">
                      No videos uploaded yet.
                    </p>
                    <button
                      type="button"
                      onClick={openPortfolioEditor}
                      className="mt-3 text-sm font-medium text-forest underline-offset-2 hover:underline"
                    >
                      Upload your first video
                    </button>
                  </div>
                ) : (
                  <>
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {marqueeVideos.map((video) => (
                        <li
                          key={video.id}
                          className="overflow-hidden rounded-xl border border-brown/15 bg-white"
                        >
                          <div className="relative aspect-[9/16] bg-brown/10">
                            <VideoThumbnail
                              src={video.thumbnailPath}
                              alt={video.title}
                              videoSrc={video.videoPath}
                            />
                            {video.featured && (
                              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-forest px-1.5 py-0.5 text-[10px] font-semibold text-paper">
                                In carousel
                              </span>
                            )}
                          </div>
                          <p className="truncate px-2 py-1.5 text-xs font-medium text-brown">
                            {video.title || "Untitled"}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap items-center gap-2">
                      {featuredPortfolioVideos.length > 0 ? (
                        <p className="flex max-w-full items-start gap-1.5 rounded-full bg-lavender/35 px-2.5 py-1 text-xs font-medium break-words text-ink">
                          <span aria-hidden>🌸</span>
                          {featuredPortfolioVideos.length} live on your site
                        </p>
                      ) : (
                        <p className="text-xs text-muted">
                          No videos are marked for the carousel yet — showing
                          all {portfolioVideos.length} as a fallback.
                        </p>
                      )}
                      {featuredPortfolioVideos.length === 0 && (
                        <button
                          type="button"
                          onClick={openPortfolioEditor}
                          className="text-xs font-medium text-forest underline-offset-2 hover:underline"
                        >
                          Choose featured clips
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Section title (cursive)</span>
                <AutoResizeTextarea
                  value={form.work.heading}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      work: { ...current.work, heading: event.target.value },
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </section>
          )}

          {activeSection === "photography" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">
                  Photography collage
                </h3>
                <p className="mt-1 text-sm text-muted">
                  The scrapbook grid under the scalloped photography banner.
                  Shape controls how much room each tile takes.
                </p>
              </div>

              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Banner label</span>
                <AutoResizeTextarea
                  value={form.photography.label}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      photography: {
                        ...current.photography,
                        label: event.target.value,
                      },
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {form.photography.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    ref={(element) => {
                      photoCardRefs.current[photo.id] = element;
                    }}
                    data-editor-focused={focusedPhotoId === photo.id || undefined}
                    className={`${cardClass} ${
                      focusedPhotoId === photo.id
                        ? "border-forest/70 bg-lavender/20 ring-2 ring-forest/35 ring-offset-2 ring-offset-paper"
                        : ""
                    }`}
                  >
                    <RowControls
                      label="Tile"
                      index={index}
                      count={form.photography.photos.length}
                      onMove={(delta) =>
                        setForm((current) => ({
                          ...current,
                          photography: {
                            ...current.photography,
                            photos: moveItem(
                              current.photography.photos,
                              index,
                              delta,
                            ),
                          },
                        }))
                      }
                      onRemove={() =>
                        setForm((current) => ({
                          ...current,
                          photography: {
                            ...current.photography,
                            photos: current.photography.photos.filter(
                              (_, i) => i !== index,
                            ),
                          },
                        }))
                      }
                    />
                    {focusedPhotoId === photo.id && (
                      <p className="rounded-lg bg-forest px-2.5 py-1.5 text-xs font-semibold text-paper">
                        Selected from the photo grid
                      </p>
                    )}
                    <label className="block text-sm">
                      <span className="text-muted">Alt text</span>
                      <AutoResizeTextarea
                        value={photo.alt}
                        onChange={(event) =>
                          setForm((current) => {
                            const photos = [...current.photography.photos];
                            photos[index] = {
                              ...photos[index],
                              alt: event.target.value,
                            };
                            return {
                              ...current,
                              photography: { ...current.photography, photos },
                            };
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Shape</span>
                      <select
                        value={photo.shape}
                        onChange={(event) =>
                          setForm((current) => {
                            const photos = [...current.photography.photos];
                            photos[index] = {
                              ...photos[index],
                              shape: event.target.value as CollagePhotoShape,
                            };
                            return {
                              ...current,
                              photography: { ...current.photography, photos },
                            };
                          })
                        }
                        className={inputClass}
                      >
                        <option value="square">Square</option>
                        <option value="tall">Tall</option>
                        <option value="wide">Wide</option>
                      </select>
                    </label>
                    <div className="block text-sm">
                      <span className="text-muted">Photo</span>
                      {savedCollageIds.has(photo.id) ? (
                        <>
                          <FileUploadButton
                            className="mt-1"
                            kind="photo"
                            accept="image/*"
                            selectedName={photo.imagePath}
                            previewUrl={photo.imagePath}
                            buttonLabel={
                              photo.imagePath ? "Swap photo" : "Add a photo"
                            }
                            disabled={loading}
                            onChange={(file) => {
                              if (file) void uploadPhoto(photo.id, file, "collage");
                            }}
                            onRemove={
                              photo.imagePath
                                ? () => {
                                    void removePhoto(photo.id, "collage");
                                  }
                                : undefined
                            }
                          />
                          {photo.imagePath && (
                            <p className="mt-2 flex max-w-full items-start gap-1.5 rounded-full bg-lavender/35 px-2.5 py-1 text-xs font-medium break-words text-ink">
                              <span aria-hidden>🌸</span>
                              Live on your site
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 rounded-xl bg-honey/25 px-3 py-2 text-xs text-brown">
                          Save the site content first, then upload a photo here.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <AddRowButton
                label={`Add tile (${form.photography.photos.length} of ${MAX_COLLAGE_TILES})`}
                disabled={form.photography.photos.length >= MAX_COLLAGE_TILES}
                onClick={() =>
                  setForm((current) => {
                    if (current.photography.photos.length >= MAX_COLLAGE_TILES) {
                      return current;
                    }
                    return {
                      ...current,
                      photography: {
                        ...current.photography,
                        photos: [
                          ...current.photography.photos,
                          {
                            id: uniqueId("collage"),
                            alt: "Photography collage image",
                            shape: "square" as CollagePhotoShape,
                          },
                        ],
                      },
                    };
                  })
                }
              />
            </section>
          )}

          {activeSection === "brands" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">
                  Brands I've worked with
                </h3>
                <p className="mt-1 text-sm text-muted">
                  The brand list that sits under What Is UGC. Upload a logo, or
                  leave it empty to show the brand name as text.
                </p>
              </div>

              <label className="flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-brown/15 bg-cream/55 p-4 text-sm">
                <span>
                  <span className="block font-semibold text-brown">
                    Show the brands section
                  </span>
                  <span className="mt-1 block text-muted">
                    Admin view still previews it while hidden.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.brands.visible}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      brands: { ...current.brands, visible: event.target.checked },
                    }))
                  }
                  className="h-5 w-5 accent-forest"
                />
              </label>

              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Section headline</span>
                <AutoResizeTextarea
                  value={form.brands.heading}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      brands: { ...current.brands, heading: event.target.value },
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {form.brands.items.map((brand, index) => (
                  <div key={brand.id} className={cardClass}>
                    <RowControls
                      label="Brand"
                      index={index}
                      count={form.brands.items.length}
                      onMove={(delta) =>
                        setForm((current) => ({
                          ...current,
                          brands: {
                            ...current.brands,
                            items: moveItem(current.brands.items, index, delta),
                          },
                        }))
                      }
                      onRemove={() =>
                        setForm((current) => ({
                          ...current,
                          brands: {
                            ...current.brands,
                            items: current.brands.items.filter(
                              (_, i) => i !== index,
                            ),
                          },
                        }))
                      }
                    />
                    <label className="block text-sm">
                      <span className="text-muted">Brand name</span>
                      <AutoResizeTextarea
                        value={brand.name}
                        onChange={(event) =>
                          setForm((current) => {
                            const items = [...current.brands.items];
                            items[index] = {
                              ...items[index],
                              name: event.target.value,
                            };
                            return {
                              ...current,
                              brands: { ...current.brands, items },
                            };
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Link (optional)</span>
                      <AutoResizeTextarea
                        value={brand.url ?? ""}
                        placeholder="https://"
                        onChange={(event) =>
                          setForm((current) => {
                            const items = [...current.brands.items];
                            items[index] = {
                              ...items[index],
                              url: event.target.value,
                            };
                            return {
                              ...current,
                              brands: { ...current.brands, items },
                            };
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                    <div className="block text-sm">
                      <span className="text-muted">Logo (optional)</span>
                      {savedBrandIds.has(brand.id) ? (
                        <>
                          <FileUploadButton
                            className="mt-1"
                            kind="photo"
                            accept="image/*"
                            selectedName={brand.logoPath}
                            previewUrl={brand.logoPath}
                            buttonLabel={brand.logoPath ? "Swap logo" : "Add a logo"}
                            disabled={loading}
                            onChange={(file) => {
                              if (file) {
                                void uploadPhoto(brand.id, file, "brandLogo");
                              }
                            }}
                            onRemove={
                              brand.logoPath
                                ? () => {
                                    void removePhoto(brand.id, "brandLogo");
                                  }
                                : undefined
                            }
                          />
                          {brand.logoPath && (
                            <p className="mt-2 flex max-w-full items-start gap-1.5 rounded-full bg-lavender/35 px-2.5 py-1 text-xs font-medium break-words text-ink">
                              <span aria-hidden>🌸</span>
                              Live on your site
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 rounded-xl bg-honey/25 px-3 py-2 text-xs text-brown">
                          Save the site content first, then upload a logo here.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <AddRowButton
                label="Add brand"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    brands: {
                      ...current.brands,
                      items: [
                        ...current.brands.items,
                        { id: uniqueId("brand"), name: "New brand" },
                      ],
                    },
                  }))
                }
              />
            </section>
          )}

          {activeSection === "ugc" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Why UGC</h3>
                <p className="mt-1 text-sm text-muted">
                  The merged explainer section: definition copy, proof stats, the
                  big callout, and the benefits checklist.
                </p>
              </div>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Section headline</span>
                <AutoResizeTextarea
                  value={form.whatIsUgc.heading}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      whatIsUgc: {
                        ...current.whatIsUgc,
                        heading: event.target.value,
                      },
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Definition</span>
                <AutoResizeTextarea
                  value={form.whatIsUgc.body}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      whatIsUgc: {
                        ...current.whatIsUgc,
                        body: event.target.value,
                      },
                    }))
                  }
                  rows={7}
                  className={inputClass}
                />
              </label>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Eyebrow</span>
                <AutoResizeTextarea
                  value={form.ugcBenefits.eyebrow}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ugcBenefits: {
                        ...current.ugcBenefits,
                        eyebrow: event.target.value,
                      },
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <div>
                <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Proof stats (circles)
                </p>
                <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {form.ugcBenefits.stats.map((stat, index) => (
                    <div key={stat.id} className={cardClass}>
                      <RowControls
                        label="Stat"
                        index={index}
                        count={form.ugcBenefits.stats.length}
                        onMove={(delta) =>
                          setForm((current) => ({
                            ...current,
                            ugcBenefits: {
                              ...current.ugcBenefits,
                              stats: moveItem(
                                current.ugcBenefits.stats,
                                index,
                                delta,
                              ),
                            },
                          }))
                        }
                        onRemove={() =>
                          setForm((current) => ({
                            ...current,
                            ugcBenefits: {
                              ...current.ugcBenefits,
                              stats: current.ugcBenefits.stats.filter(
                                (_, i) => i !== index,
                              ),
                            },
                          }))
                        }
                      />
                      <label className="block text-sm">
                        <span className="text-muted">Figure</span>
                        <AutoResizeTextarea
                          value={stat.value}
                          onChange={(event) =>
                            setForm((current) => {
                              const stats = [...current.ugcBenefits.stats];
                              stats[index] = {
                                ...stats[index],
                                value: event.target.value,
                              };
                              return {
                                ...current,
                                ugcBenefits: { ...current.ugcBenefits, stats },
                              };
                            })
                          }
                          className={inputClass}
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="text-muted">Label</span>
                        <AutoResizeTextarea
                          value={stat.label}
                          onChange={(event) =>
                            setForm((current) => {
                              const stats = [...current.ugcBenefits.stats];
                              stats[index] = {
                                ...stats[index],
                                label: event.target.value,
                              };
                              return {
                                ...current,
                                ugcBenefits: { ...current.ugcBenefits, stats },
                              };
                            })
                          }
                          rows={3}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <AddRowButton
                    label="Add proof stat"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        ugcBenefits: {
                          ...current.ugcBenefits,
                          stats: [
                            ...current.ugcBenefits.stats,
                            { id: uniqueId("ugc-stat"), value: "", label: "" },
                          ],
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className={`${cardClass} max-w-2xl`}>
                <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Big callout
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-muted">Label</span>
                    <AutoResizeTextarea
                      value={form.ugcBenefits.calloutLabel}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          ugcBenefits: {
                            ...current.ugcBenefits,
                            calloutLabel: event.target.value,
                          },
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-muted">Figure</span>
                    <AutoResizeTextarea
                      value={form.ugcBenefits.calloutValue}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          ugcBenefits: {
                            ...current.ugcBenefits,
                            calloutValue: event.target.value,
                          },
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="text-muted">Supporting copy</span>
                  <AutoResizeTextarea
                    value={form.ugcBenefits.calloutBody}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        ugcBenefits: {
                          ...current.ugcBenefits,
                          calloutBody: event.target.value,
                        },
                      }))
                    }
                    rows={3}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className={`${cardClass} max-w-2xl`}>
                <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Benefits checklist
                </p>
                <label className="block text-sm">
                  <span className="text-muted">Card heading</span>
                  <AutoResizeTextarea
                    value={form.ugcBenefits.benefitsHeading}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        ugcBenefits: {
                          ...current.ugcBenefits,
                          benefitsHeading: event.target.value,
                        },
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                {form.ugcBenefits.benefits.map((benefit, index) => (
                  <div key={`benefit-${index}`} className="flex items-end gap-2">
                    <label className="block flex-1 text-sm">
                      <span className="text-muted">Benefit {index + 1}</span>
                      <AutoResizeTextarea
                        value={benefit}
                        onChange={(event) =>
                          setForm((current) => {
                            const benefits = [...current.ugcBenefits.benefits];
                            benefits[index] = event.target.value;
                            return {
                              ...current,
                              ugcBenefits: { ...current.ugcBenefits, benefits },
                            };
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          ugcBenefits: {
                            ...current.ugcBenefits,
                            benefits: current.ugcBenefits.benefits.filter(
                              (_, i) => i !== index,
                            ),
                          },
                        }))
                      }
                      aria-label={`Remove benefit ${index + 1}`}
                      className={`${smallButtonClass} mb-2 hover:border-blush-deep/60 hover:text-blush-deep`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <AddRowButton
                  label="Add benefit"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      ugcBenefits: {
                        ...current.ugcBenefits,
                        benefits: [...current.ugcBenefits.benefits, ""],
                      },
                    }))
                  }
                />
              </div>
            </section>
          )}

          {activeSection === "services" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Services</h3>
                <p className="mt-1 text-sm text-muted">
                  Titles and descriptions for each offering.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {form.services.map((service, index) => (
                  <div
                    key={service.id}
                    className="space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4"
                  >
                    <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                      Service {index + 1}
                    </p>
                    <label className="block text-sm">
                      <span className="text-muted">Title</span>
                      <AutoResizeTextarea
                        value={service.title}
                        onChange={(event) =>
                          setForm((current) => {
                            const services = [...current.services];
                            services[index] = {
                              ...services[index],
                              title: event.target.value,
                            };
                            return { ...current, services };
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Description</span>
                      <AutoResizeTextarea
                        value={service.description}
                        onChange={(event) =>
                          setForm((current) => {
                            const services = [...current.services];
                            services[index] = {
                              ...services[index],
                              description: event.target.value,
                            };
                            return { ...current, services };
                          })
                        }
                        rows={3}
                        className={inputClass}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "testimonials" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Testimonials</h3>
                <p className="mt-1 text-sm text-muted">
                  Quotes for social proof. Hide this section from regular view
                  until Emily is ready to publish it.
                </p>
              </div>
              <label className="flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-brown/15 bg-cream/55 p-4 text-sm">
                <span>
                  <span className="block font-semibold text-brown">
                    Show testimonials in regular view
                  </span>
                  <span className="mt-1 block text-muted">
                    Admin view can still preview this section while hidden.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.testimonials.visible}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      testimonials: {
                        ...current.testimonials,
                        visible: event.target.checked,
                      },
                    }))
                  }
                  className="h-5 w-5 accent-forest"
                />
              </label>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Section headline</span>
                <AutoResizeTextarea
                  value={form.testimonials.heading}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      testimonials: {
                        ...current.testimonials,
                        heading: event.target.value,
                      },
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Intro</span>
                <AutoResizeTextarea
                  value={form.testimonials.intro}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      testimonials: {
                        ...current.testimonials,
                        intro: event.target.value,
                      },
                    }))
                  }
                  rows={4}
                  className={inputClass}
                />
              </label>
              <div className="grid gap-4 lg:grid-cols-2">
                {form.testimonials.items.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className="space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4"
                  >
                    <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                      Testimonial {index + 1}
                    </p>
                    <label className="block text-sm">
                      <span className="text-muted">Quote</span>
                      <AutoResizeTextarea
                        value={testimonial.quote}
                        onChange={(event) =>
                          setForm((current) => {
                            const items = [...current.testimonials.items];
                            items[index] = {
                              ...items[index],
                              quote: event.target.value,
                            };
                            return {
                              ...current,
                              testimonials: {
                                ...current.testimonials,
                                items,
                              },
                            };
                          })
                        }
                        rows={5}
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Name</span>
                      <AutoResizeTextarea
                        value={testimonial.name}
                        onChange={(event) =>
                          setForm((current) => {
                            const items = [...current.testimonials.items];
                            items[index] = {
                              ...items[index],
                              name: event.target.value,
                            };
                            return {
                              ...current,
                              testimonials: {
                                ...current.testimonials,
                                items,
                              },
                            };
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Role or context</span>
                      <AutoResizeTextarea
                        value={testimonial.role}
                        onChange={(event) =>
                          setForm((current) => {
                            const items = [...current.testimonials.items];
                            items[index] = {
                              ...items[index],
                              role: event.target.value,
                            };
                            return {
                              ...current,
                              testimonials: {
                                ...current.testimonials,
                                items,
                              },
                            };
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "cta" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Closing CTA</h3>
                <p className="mt-1 text-sm text-muted">
                  The &ldquo;Let&apos;s work together&rdquo; section at the bottom
                  of the home page — headline, message, video, and links.
                </p>
              </div>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Headline (cursive)</span>
                <AutoResizeTextarea
                  value={form.closingCta.headline}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      closingCta: {
                        ...current.closingCta,
                        headline: event.target.value,
                      },
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Message</span>
                <AutoResizeTextarea
                  value={form.closingCta.body}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      closingCta: {
                        ...current.closingCta,
                        body: event.target.value,
                      },
                    }))
                  }
                  rows={6}
                  className={inputClass}
                />
              </label>

              <div className="max-w-2xl space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4">
                <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  CTA video
                </p>
                <p className="text-sm text-muted">
                  Plays muted on a loop next to the headline. Visitors can unmute
                  it. Goes live as soon as you pick a file — no need to press
                  &ldquo;Save site content&rdquo;.
                </p>
                {renderVideoUpload("cta", form.closingCta.videoPath)}
              </div>

              <div className="grid max-w-2xl gap-4">
                <label className="block text-sm">
                  <span className="text-muted">
                    Email button text (what visitors see on the pill)
                  </span>
                  <AutoResizeTextarea
                    value={form.closingCta.emailLabel}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        closingCta: {
                          ...current.closingCta,
                          emailLabel: event.target.value,
                        },
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-muted">Instagram URL</span>
                  <AutoResizeTextarea
                    value={form.social.instagram}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        social: {
                          ...current.social,
                          instagram: event.target.value,
                        },
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-muted">Email link</span>
                  <AutoResizeTextarea
                    value={form.social.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        social: { ...current.social, email: event.target.value },
                      }))
                    }
                    className={inputClass}
                  />
                </label>
              </div>
            </section>
          )}
        </div>

        <div className="min-w-0 shrink-0 border-t border-brown/10 bg-paper px-3 py-3 sm:px-6">
          {error && (
            <p className="mb-2 rounded-xl bg-blush/15 px-4 py-2 text-sm text-brown">
              {error}
            </p>
          )}
          {message && (
            <p className="mb-2 rounded-xl bg-lavender/25 px-4 py-2 text-sm text-ink">
              {message}
            </p>
          )}

          <AnimatedButton
            onClick={() => void save()}
            disabled={loading || uploadBusy}
            className="w-full shadow-md shadow-forest/15 sm:max-w-xs"
          >
            {loading ? "Saving…" : "Save site content"}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
