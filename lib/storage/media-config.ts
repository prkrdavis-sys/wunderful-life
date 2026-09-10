import { hasMediaConfig } from "./media-host";
import { MAX_VIDEO_BYTES } from "@/lib/videos/upload";

export type MediaUploadConfig = {
  clientUpload: boolean;
  handleUploadUrl: string;
  directUploadLimitBytes: number;
};

export function mediaUploadConfig(origin: string): MediaUploadConfig {
  return {
    clientUpload: hasMediaConfig(),
    handleUploadUrl: `${origin}/api/videos/upload`,
    directUploadLimitBytes: MAX_VIDEO_BYTES,
  };
}
