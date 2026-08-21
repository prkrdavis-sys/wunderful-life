import type { Dispatch, RefObject, SetStateAction } from "react";
import type { SiteContent } from "@/lib/site/types";
import type { PhotoKind } from "@/lib/site/photo-slots";
import type { VideoSlot } from "@/lib/site/video-slots";
import type { MediaUploadState } from "@/lib/videos/client-pipeline";
import type { PortfolioVideo } from "@/lib/videos/types";

export type SiteEditorFieldsProps = {
  form: SiteContent;
  setForm: Dispatch<SetStateAction<SiteContent>>;
  loading: boolean;
  uploadPhoto: (id: string, file: File, kind?: PhotoKind) => void;
  removePhoto: (id: string, kind?: PhotoKind) => void;
};

export type SiteEditorVideoProps = {
  videoFiles: Record<VideoSlot, File | null>;
  videoUploads: Record<VideoSlot, MediaUploadState>;
  videoPreviewUrls: Record<VideoSlot, string | null>;
  heroVideoInputRef: RefObject<HTMLInputElement | null>;
  ctaVideoInputRef: RefObject<HTMLInputElement | null>;
  startVideoUpload: (slot: VideoSlot, file: File) => void;
  rejectVideo: (slot: VideoSlot) => void;
  removeVideo: (slot: VideoSlot) => void;
  setError: (message: string | null) => void;
};

export type SiteEditorWorkProps = {
  portfolioVideos: PortfolioVideo[];
  portfolioVideosLoaded: boolean;
};
