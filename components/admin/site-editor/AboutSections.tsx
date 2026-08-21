import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";
import { AboutPhotoEditorCard } from "@/components/admin/site-editor/AboutPhotoEditorCard";
import { withAboutPhoto } from "@/components/admin/site-editor/aboutPhotos";
import { ABOUT_INTRO_PHOTO_COUNT, inputClass } from "@/components/admin/site-editor/constants";
import type { SiteEditorFieldsProps } from "@/components/admin/site-editor/types";

export function AboutEditor({
  form,
  setForm,
  loading,
  uploadPhoto,
  removePhoto,
}: SiteEditorFieldsProps) {
  return (
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
        {form.about.photos.slice(0, ABOUT_INTRO_PHOTO_COUNT).map((photo, index) => (
          <AboutPhotoEditorCard
            key={photo.id}
            photo={photo}
            heading={index === 0 ? "Main photo" : "Accent photo"}
            loading={loading}
            onCaptionChange={(caption) =>
              setForm((current) => withAboutPhoto(current, index, { caption }))
            }
            onRotateChange={(rotate) =>
              setForm((current) => withAboutPhoto(current, index, { rotate }))
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
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">A little more</h3>
        <p className="mt-1 text-sm text-muted">
          Gallery photos below About. Upload images, captions, and rotation for
          each photo.
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
  );
}
