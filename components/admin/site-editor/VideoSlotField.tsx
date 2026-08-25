import type { RefObject } from "react";
import { FileUploadButton } from "@/components/ui/FileUploadButton";
import { UploadProgressBar } from "@/components/ui/UploadProgressBar";
import { isVercelBlobUrl } from "@/lib/storage/blob";
import { assetDisplayName } from "@/lib/files";
import {
  isAcceptedVideoFile,
  VIDEO_FILE_ACCEPT,
  videoUploadErrorMessage,
} from "@/lib/videos/upload";
import {
  isMediaUploadBusy,
  type MediaUploadState,
} from "@/lib/videos/client-pipeline";
import {
  type VideoSlot,
  videoSlotDescriptor,
} from "@/lib/site/video-slots";
import { LiveOnSiteNote } from "@/components/admin/site-editor/LiveOnSiteNote";

export function VideoSlotField({
  slot,
  videoPath,
  file,
  previewUrl,
  state,
  inputRef,
  disabled,
  onError,
  onSelect,
  onReject,
  onRemove,
}: {
  slot: VideoSlot;
  videoPath: string | undefined;
  file: File | null;
  previewUrl: string | null;
  state: MediaUploadState;
  inputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onError: (message: string) => void;
  onSelect: (file: File) => void;
  onReject: () => void;
  onRemove: () => void;
}) {
  const { noun, hint } = videoSlotDescriptor(slot);
  const busy = isMediaUploadBusy(state);

  return (
    <>
      <FileUploadButton
        kind="video"
        inputRef={inputRef}
        accept={VIDEO_FILE_ACCEPT}
        hint={hint}
        selectedName={file?.name ?? (videoPath ? assetDisplayName(videoPath) : null)}
        previewUrl={busy ? null : (previewUrl ?? videoPath ?? null)}
        previewType="video"
        disabled={busy || disabled}
        buttonLabel={videoPath ? "Swap video" : "Add a video"}
        onChange={(next) => {
          if (!next) return;
          if (!isAcceptedVideoFile(next)) {
            onReject();
            onError(videoUploadErrorMessage());
            if (inputRef.current) inputRef.current.value = "";
            return;
          }
          onSelect(next);
        }}
        onRemove={onRemove}
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
        <LiveOnSiteNote>
          {isVercelBlobUrl(videoPath)
            ? "Stored on the old host — re-upload to keep this video cheap to play"
            : "Live on your site — no Save needed"}
        </LiveOnSiteNote>
      )}
    </>
  );
}
