import type { ReactNode } from "react";
import {
  ABOUT_PHOTO_FRAMES,
  resolveAboutPhotoFrame,
  type AboutPhoto,
  type AboutPhotoFrame,
} from "@/lib/site/types";
import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";
import { FileUploadButton } from "@/components/ui/FileUploadButton";
import { inputClass } from "@/components/admin/site-editor/constants";
import { LiveOnSiteNote } from "@/components/admin/site-editor/LiveOnSiteNote";

const FRAME_LABELS: Record<AboutPhotoFrame, string> = {
  arch: "Arch",
  oval: "Oval",
  polaroid: "Polaroid",
  circle: "Circle",
  rounded: "Rounded",
  square: "Square",
};

export function AboutPhotoEditorCard({
  photo,
  heading,
  leading,
  loading,
  onCaptionChange,
  onShowCaptionChange,
  onFrameChange,
  onRotateChange,
  onUpload,
  onRemove,
  uploadReady = true,
}: {
  photo: AboutPhoto;
  heading: string;
  leading?: ReactNode;
  loading: boolean;
  onCaptionChange: (caption: string) => void;
  onShowCaptionChange: (showCaption: boolean) => void;
  onFrameChange: (frame: AboutPhotoFrame) => void;
  onRotateChange: (rotate: number) => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploadReady?: boolean;
}) {
  const frame = resolveAboutPhotoFrame(photo.frame);

  return (
    <div className="space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4">
      {leading ?? (
        <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
          {heading}
        </p>
      )}
      <label className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted">Show caption</span>
        <input
          type="checkbox"
          checked={photo.showCaption !== false}
          onChange={(event) => onShowCaptionChange(event.target.checked)}
          className="h-5 w-5 accent-forest"
        />
      </label>
      {photo.showCaption !== false ? (
        <label className="block text-sm">
          <span className="text-muted">Caption</span>
          <AutoResizeTextarea
            value={photo.caption}
            onChange={(event) => onCaptionChange(event.target.value)}
            className={inputClass}
          />
        </label>
      ) : null}
      <label className="block text-sm">
        <span className="text-muted">Frame</span>
        <select
          value={frame}
          onChange={(event) =>
            onFrameChange(event.target.value as AboutPhotoFrame)
          }
          className={inputClass}
        >
          {ABOUT_PHOTO_FRAMES.map((frame) => (
            <option key={frame} value={frame}>
              {FRAME_LABELS[frame]}
            </option>
          ))}
        </select>
      </label>
      {frame === "polaroid" ? (
        <label className="block text-sm">
          <span className="text-muted">Rotate (deg)</span>
          <input
            type="number"
            value={photo.rotate}
            onChange={(event) => onRotateChange(Number(event.target.value))}
            className={inputClass}
          />
        </label>
      ) : null}
      <div className="block text-sm">
        <span className="text-muted">Photo</span>
        {uploadReady ? (
          <>
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
              <LiveOnSiteNote>Live on your site</LiveOnSiteNote>
            )}
          </>
        ) : (
          <p className="mt-1 rounded-xl bg-honey/25 px-3 py-2 text-xs text-brown">
            Save the site content first, then upload a photo here.
          </p>
        )}
      </div>
    </div>
  );
}
