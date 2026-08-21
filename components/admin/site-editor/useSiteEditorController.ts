"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { toErrorMessage } from "@/lib/errors";
import { readResponseJson } from "@/lib/http/json";
import { mergePhotoMedia, mergeSlotVideo } from "@/lib/site/merge-media";
import { preparePhotoForUpload } from "@/lib/site/photos";
import {
  PHOTO_KIND_DESCRIPTORS,
  type PhotoKind,
} from "@/lib/site/photo-slots";
import { siteVersionFromResponse } from "@/lib/site/response";
import type { SiteContent } from "@/lib/site/types";
import {
  type VideoSlot,
  videoSlotDescriptor,
} from "@/lib/site/video-slots";
import { uploadMediaToStorage } from "@/lib/storage/client-upload";
import {
  appendPreparedUpload,
  getMediaUploadConfig,
  idleMediaUpload,
  isMediaUploadBusy,
  isUploadAborted,
  prepareAndUploadVideo,
  type MediaUploadState,
} from "@/lib/videos/client-pipeline";

function titleCaseNoun(noun: string): string {
  return `${noun[0]?.toUpperCase() ?? ""}${noun.slice(1)}`;
}

export function useSiteEditorController(onSaved?: (site: SiteContent) => void) {
  const { site, setSite, siteVersion, setSiteVersion } = useAdminView();
  const [form, setForm] = useState(site);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [videoFiles, setVideoFiles] = useState<Record<VideoSlot, File | null>>({
    hero: null,
    cta: null,
  });
  const [videoUploads, setVideoUploads] = useState<
    Record<VideoSlot, MediaUploadState>
  >({
    hero: idleMediaUpload(),
    cta: idleMediaUpload(),
  });
  const videoUploadGenRef = useRef<Record<VideoSlot, number>>({ hero: 0, cta: 0 });
  const heroVideoInputRef = useRef<HTMLInputElement>(null);
  const ctaVideoInputRef = useRef<HTMLInputElement>(null);

  const uploadBusy =
    isMediaUploadBusy(videoUploads.hero) || isMediaUploadBusy(videoUploads.cta);

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
    const generations = videoUploadGenRef.current;
    return () => {
      generations.hero += 1;
      generations.cta += 1;
    };
  }, []);

  const videoInputRef = (slot: VideoSlot) =>
    slot === "hero" ? heroVideoInputRef : ctaVideoInputRef;

  const setSlotUpload = (slot: VideoSlot, state: MediaUploadState) =>
    setVideoUploads((current) => ({ ...current, [slot]: state }));

  const refreshAfterConflict = async () => {
    const latestResponse = await fetch("/api/site", { cache: "no-store" });
    const latest = await readResponseJson<SiteContent>(latestResponse);
    setSite(latest);
    setSiteVersion(siteVersionFromResponse(latestResponse));
    setError(
      "This change was not applied because the site changed elsewhere. Your edits are still here; review them against the latest site and try again.",
    );
  };

  const applySavedMedia = (
    saved: SiteContent,
    version: number,
    merge: (draft: SiteContent) => SiteContent,
  ) => {
    setForm(merge);
    setSite(saved);
    setSiteVersion(version);
  };

  const startVideoUpload = async (slot: VideoSlot, file: File) => {
    const generation = ++videoUploadGenRef.current[slot];
    const version = siteVersion;
    const descriptor = videoSlotDescriptor(slot);
    setError(null);
    setMessage(null);
    setVideoFiles((current) => ({ ...current, [slot]: file }));
    setSlotUpload(slot, {
      status: "preparing",
      progress: 0,
      message: "Preparing video…",
      error: null,
    });

    try {
      const result = await prepareAndUploadVideo({
        file,
        profile: descriptor.profile,
        dir: descriptor.dir,
        capture: descriptor.persistPoster ? "poster" : "none",
        stillDir: descriptor.dir,
        isCurrent: () => generation === videoUploadGenRef.current[slot],
        onProgress: (update) => {
          if (generation !== videoUploadGenRef.current[slot]) return;
          setSlotUpload(slot, {
            status: update.status,
            progress: update.progress ?? 0,
            message: update.message.replace("video", descriptor.noun),
            error: null,
          });
        },
      });

      const payload = new FormData();
      appendPreparedUpload(payload, result.video, {
        url: "videoUrl",
        file: "video",
      });
      appendPreparedUpload(payload, result.still, {
        url: "posterUrl",
        file: "poster",
      });

      const response = await fetch(descriptor.endpoint, {
        method: "POST",
        headers: { "X-Site-Version": String(version) },
        body: payload,
      });
      const data = await readResponseJson<SiteContent & { error?: string }>(
        response,
        { payload: "video" },
      );
      if (generation !== videoUploadGenRef.current[slot]) return;

      if (!response.ok) {
        if (response.status === 409) {
          await refreshAfterConflict();
          throw new Error("The upload was not applied because the site changed.");
        }
        throw new Error(data.error ?? `Failed to upload ${descriptor.noun}.`);
      }

      applySavedMedia(data, siteVersionFromResponse(response), (draft) =>
        mergeSlotVideo(draft, data, slot),
      );
      setVideoFiles((current) => ({ ...current, [slot]: null }));
      const input = videoInputRef(slot).current;
      if (input) input.value = "";
      setSlotUpload(slot, {
        status: "ready",
        progress: 100,
        message: "Already on your site — no need to press Save.",
        error: null,
      });
      setMessage(
        `${titleCaseNoun(descriptor.noun)} is on your site now — no need to press Save.`,
      );
    } catch (err) {
      if (isUploadAborted(err) || generation !== videoUploadGenRef.current[slot]) {
        return;
      }
      const uploadError = toErrorMessage(err, `${descriptor.noun} upload failed.`);
      setSlotUpload(slot, {
        status: "error",
        progress: 0,
        message: uploadError,
        error: uploadError,
      });
      setError(uploadError);
    }
  };

  const rejectVideo = (slot: VideoSlot) => {
    videoUploadGenRef.current[slot] += 1;
    setVideoFiles((current) => ({ ...current, [slot]: null }));
    setSlotUpload(slot, idleMediaUpload());
    const input = videoInputRef(slot).current;
    if (input) input.value = "";
  };

  const removeVideo = async (slot: VideoSlot) => {
    const descriptor = videoSlotDescriptor(slot);
    const hadPending = Boolean(videoFiles[slot]);
    const version = siteVersion;

    videoUploadGenRef.current[slot] += 1;
    setVideoFiles((current) => ({ ...current, [slot]: null }));
    setSlotUpload(slot, idleMediaUpload());
    const input = videoInputRef(slot).current;
    if (input) input.value = "";

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
      const response = await fetch(descriptor.endpoint, {
        method: "DELETE",
        headers: { "X-Site-Version": String(version) },
      });
      const data = await readResponseJson<SiteContent & { error?: string }>(
        response,
        { payload: "video" },
      );

      if (!response.ok) {
        if (response.status === 409) {
          await refreshAfterConflict();
          throw new Error(
            `The ${descriptor.noun} removal was not applied because the site changed.`,
          );
        }
        throw new Error(data.error ?? `Failed to remove ${descriptor.noun}.`);
      }

      applySavedMedia(data, siteVersionFromResponse(response), (draft) =>
        mergeSlotVideo(draft, data, slot),
      );
      setMessage(`${titleCaseNoun(descriptor.noun)} removed.`);
    } catch (err) {
      setError(toErrorMessage(err, `Failed to remove ${descriptor.noun}.`));
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (
    photoId: string,
    file: File,
    kind: PhotoKind = "about",
  ) => {
    const version = siteVersion;
    const descriptor = PHOTO_KIND_DESCRIPTORS[kind];
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const prepared = await preparePhotoForUpload(file, {
        preferJpeg: kind !== "brandLogo",
        maxEdge: kind === "brandLogo" ? 800 : 1920,
      });
      const payload = new FormData();
      const endpoint = `${descriptor.endpoint}/${photoId}`;
      const config = await getMediaUploadConfig();

      if (config.clientUpload) {
        const imageUrl = await uploadMediaToStorage(
          prepared,
          descriptor.folder,
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
      const data = await readResponseJson<SiteContent & { error?: string }>(
        response,
        { payload: "photo" },
      );

      if (!response.ok) {
        if (response.status === 409) {
          await refreshAfterConflict();
          throw new Error("The upload was not applied because the site changed.");
        }
        throw new Error(data.error ?? `Failed to upload ${descriptor.noun}.`);
      }

      applySavedMedia(data, siteVersionFromResponse(response), (draft) =>
        mergePhotoMedia(draft, data, kind, photoId),
      );
      setMessage(kind === "brandLogo" ? "Logo uploaded." : "Photo uploaded.");
    } catch (err) {
      setError(toErrorMessage(err, `Failed to upload ${descriptor.noun}.`));
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async (photoId: string, kind: PhotoKind = "about") => {
    const version = siteVersion;
    const descriptor = PHOTO_KIND_DESCRIPTORS[kind];
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${descriptor.endpoint}/${photoId}`, {
        method: "DELETE",
        headers: { "X-Site-Version": String(version) },
      });
      const data = await readResponseJson<SiteContent & { error?: string }>(
        response,
        { payload: "photo" },
      );

      if (!response.ok) {
        if (response.status === 409) {
          await refreshAfterConflict();
          throw new Error("The removal was not applied because the site changed.");
        }
        throw new Error(data.error ?? `Failed to remove ${descriptor.noun}.`);
      }

      applySavedMedia(data, siteVersionFromResponse(response), (draft) =>
        mergePhotoMedia(draft, data, kind, photoId),
      );
      setMessage(kind === "brandLogo" ? "Logo removed." : "Photo removed.");
    } catch (err) {
      setError(toErrorMessage(err, `Failed to remove ${descriptor.noun}.`));
    } finally {
      setLoading(false);
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
      const data = await readResponseJson<SiteContent & { error?: string }>(
        response,
      );

      if (!response.ok) {
        if (response.status === 409) {
          await refreshAfterConflict();
          return;
        }
        throw new Error(data.error ?? "Failed to save.");
      }

      setSite(data);
      setForm(data);
      setSiteVersion(siteVersionFromResponse(response));
      onSaved?.(data);
      setMessage("Saved.");
    } catch (err) {
      setError(toErrorMessage(err, "Failed to save."));
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setForm,
    loading,
    error,
    setError,
    message,
    uploadBusy,
    videoFiles,
    videoUploads,
    videoPreviewUrls,
    heroVideoInputRef,
    ctaVideoInputRef,
    startVideoUpload,
    rejectVideo,
    removeVideo,
    uploadPhoto,
    removePhoto,
    save,
  };
}

export type SiteEditorController = ReturnType<typeof useSiteEditorController>;
