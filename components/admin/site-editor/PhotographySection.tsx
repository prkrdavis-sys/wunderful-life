import type { MutableRefObject } from "react";
import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { cardClass, inputClass } from "@/components/admin/site-editor/constants";
import { AddRowButton, moveItem, RowControls, uniqueId } from "@/components/admin/site-editor/list";
import { LiveOnSiteNote } from "@/components/admin/site-editor/LiveOnSiteNote";
import type { SiteEditorFieldsProps } from "@/components/admin/site-editor/types";
import { FileUploadButton } from "@/components/ui/FileUploadButton";
import { MAX_COLLAGE_TILES, type CollagePhotoShape } from "@/lib/site/types";

export function PhotographyEditor({
  form,
  setForm,
  loading,
  uploadPhoto,
  removePhoto,
  photoCardRefs,
}: SiteEditorFieldsProps & {
  photoCardRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
  const { site, location } = useAdminView();
  const focusedPhotoId =
    location.focus?.kind === "photography-photo" ? location.focus.photoId : null;
  const savedCollageIds = new Set(site.photography.photos.map((photo) => photo.id));

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">Photography collage</h3>
        <p className="mt-1 text-sm text-muted">
          The scrapbook grid under the scalloped photography banner. Shape
          controls how much room each tile takes.
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
                    photos: moveItem(current.photography.photos, index, delta),
                  },
                }))
              }
              onRemove={() =>
                setForm((current) => ({
                  ...current,
                  photography: {
                    ...current.photography,
                    photos: current.photography.photos.filter((_, i) => i !== index),
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
                    photos[index] = { ...photos[index], alt: event.target.value };
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
                    buttonLabel={photo.imagePath ? "Swap photo" : "Add a photo"}
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
  );
}
