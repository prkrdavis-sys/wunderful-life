import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { AboutPhotoEditorCard } from "@/components/admin/site-editor/AboutPhotoEditorCard";
import {
  applyAboutSite,
  withAboutPhoto,
  withAboutPhotos,
} from "@/components/admin/site-editor/aboutPhotos";
import { ABOUT_INTRO_PHOTO_COUNT, inputClass } from "@/components/admin/site-editor/constants";
import {
  AddRowButton,
  moveItem,
  RowControls,
  uniqueId,
} from "@/components/admin/site-editor/list";
import type { SiteEditorFieldsProps } from "@/components/admin/site-editor/types";
import { MAX_ABOUT_GALLERY_PHOTOS } from "@/lib/site/types";

export function AboutEditor({
  form,
  setForm,
  loading,
  uploadPhoto,
  removePhoto,
}: SiteEditorFieldsProps) {
  const { setSite } = useAdminView();

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">About Me</h3>
        <p className="mt-1 text-sm text-muted">
          Headline, subtitle, and paragraphs for the About Me section.
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
      <label className="block text-sm">
        <span className="text-muted">Section subtitle</span>
        <AutoResizeTextarea
          value={form.about.subtitle}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              about: { ...current.about, subtitle: event.target.value },
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
        {form.about.photos.slice(0, ABOUT_INTRO_PHOTO_COUNT).map((photo, index) => (
          <AboutPhotoEditorCard
            key={photo.id}
            photo={photo}
            heading={index === 0 ? "Main photo" : "Accent photo"}
            loading={loading}
            onCaptionChange={(caption) =>
              applyAboutSite(setForm, setSite, (current) =>
                withAboutPhoto(current, index, { caption }),
              )
            }
            onShowCaptionChange={(showCaption) =>
              applyAboutSite(setForm, setSite, (current) =>
                withAboutPhoto(current, index, { showCaption }),
              )
            }
            onShowShadowChange={(showShadow) =>
              applyAboutSite(setForm, setSite, (current) =>
                withAboutPhoto(current, index, { showShadow }),
              )
            }
            onFrameChange={(frame) =>
              applyAboutSite(setForm, setSite, (current) =>
                withAboutPhoto(current, index, { frame }),
              )
            }
            onRotateChange={(rotate) =>
              applyAboutSite(setForm, setSite, (current) =>
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
  );
}

export function GalleryEditor({
  form,
  setForm,
  loading,
  uploadPhoto,
  removePhoto,
}: SiteEditorFieldsProps) {
  const { setSite, site } = useAdminView();
  const galleryPhotos = form.about.photos.slice(ABOUT_INTRO_PHOTO_COUNT);
  const galleryTitle = form.about.galleryHeading.trim() || "My vibe";
  const savedGalleryIds = new Set(
    site.about.photos.slice(ABOUT_INTRO_PHOTO_COUNT).map((photo) => photo.id),
  );

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">{galleryTitle}</h3>
        <p className="mt-1 text-sm text-muted">
          Photos in the {galleryTitle} gallery. Each one can use Arch, Oval,
          Polaroid, Circle, Rounded, or Square. Rotation only applies to
          Polaroid.
        </p>
      </div>
      <label className="block max-w-2xl text-sm">
        <span className="text-muted">Section title</span>
        <AutoResizeTextarea
          value={form.about.galleryHeading}
          onChange={(event) =>
            applyAboutSite(setForm, setSite, (current) => ({
              ...current,
              about: {
                ...current.about,
                galleryHeading: event.target.value,
              },
            }))
          }
          className={inputClass}
        />
      </label>
      {galleryPhotos.length === 0 ? (
        <p className="text-sm text-muted">No gallery photos yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {galleryPhotos.map((photo, sliceIndex) => {
            const index = sliceIndex + ABOUT_INTRO_PHOTO_COUNT;
            return (
              <AboutPhotoEditorCard
                key={photo.id}
                photo={photo}
                heading={`Photo ${sliceIndex + 1}`}
                leading={
                  <RowControls
                    label="Photo"
                    index={sliceIndex}
                    count={galleryPhotos.length}
                    onMove={(delta) =>
                      setForm((current) => {
                        const intro = current.about.photos.slice(
                          0,
                          ABOUT_INTRO_PHOTO_COUNT,
                        );
                        const gallery = current.about.photos.slice(
                          ABOUT_INTRO_PHOTO_COUNT,
                        );
                        return withAboutPhotos(current, [
                          ...intro,
                          ...moveItem(gallery, sliceIndex, delta),
                        ]);
                      })
                    }
                    onRemove={() =>
                      setForm((current) =>
                        withAboutPhotos(
                          current,
                          current.about.photos.filter((_, i) => i !== index),
                        ),
                      )
                    }
                  />
                }
                loading={loading}
                onCaptionChange={(caption) =>
                  applyAboutSite(setForm, setSite, (current) =>
                    withAboutPhoto(current, index, { caption }),
                  )
                }
                onShowCaptionChange={(showCaption) =>
                  applyAboutSite(setForm, setSite, (current) =>
                    withAboutPhoto(current, index, { showCaption }),
                  )
                }
                onShowShadowChange={(showShadow) =>
                  applyAboutSite(setForm, setSite, (current) =>
                    withAboutPhoto(current, index, { showShadow }),
                  )
                }
                onFrameChange={(frame) =>
                  applyAboutSite(setForm, setSite, (current) =>
                    withAboutPhoto(current, index, { frame }),
                  )
                }
                onRotateChange={(rotate) =>
                  applyAboutSite(setForm, setSite, (current) =>
                    withAboutPhoto(current, index, { rotate }),
                  )
                }
                onUpload={(file) => {
                  void uploadPhoto(photo.id, file);
                }}
                onRemove={() => {
                  void removePhoto(photo.id);
                }}
                uploadReady={savedGalleryIds.has(photo.id)}
              />
            );
          })}
        </div>
      )}
      <AddRowButton
        label={`Add photo (${galleryPhotos.length} of ${MAX_ABOUT_GALLERY_PHOTOS})`}
        disabled={galleryPhotos.length >= MAX_ABOUT_GALLERY_PHOTOS}
        onClick={() =>
          setForm((current) => {
            if (
              current.about.photos.length - ABOUT_INTRO_PHOTO_COUNT >=
              MAX_ABOUT_GALLERY_PHOTOS
            ) {
              return current;
            }
            return withAboutPhotos(current, [
              ...current.about.photos,
              {
                id: uniqueId("vibe"),
                caption: "",
                showCaption: true,
                showShadow: true,
                rotate: 0,
                frame: "polaroid",
              },
            ]);
          })
        }
      />
    </section>
  );
}
