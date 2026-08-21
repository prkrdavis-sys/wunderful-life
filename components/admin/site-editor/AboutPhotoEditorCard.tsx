import type { AboutPhoto } from "@/lib/site/types";
import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";
import { FileUploadButton } from "@/components/ui/FileUploadButton";
import { inputClass } from "@/components/admin/site-editor/constants";
import { LiveOnSiteNote } from "@/components/admin/site-editor/LiveOnSiteNote";

export function AboutPhotoEditorCard({
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
        {photo.imagePath && <LiveOnSiteNote>Live on your site</LiveOnSiteNote>}
      </div>
    </div>
  );
}
