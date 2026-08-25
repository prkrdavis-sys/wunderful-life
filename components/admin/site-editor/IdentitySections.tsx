import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";
import { cardClass, inputClass } from "@/components/admin/site-editor/constants";
import { AddRowButton, moveItem, RowControls, uniqueId } from "@/components/admin/site-editor/list";
import { VideoSlotField } from "@/components/admin/site-editor/VideoSlotField";
import type {
  SiteEditorFieldsProps,
  SiteEditorVideoProps,
} from "@/components/admin/site-editor/types";

export function ProfileEditor({
  form,
  setForm,
}: Pick<SiteEditorFieldsProps, "form" | "setForm">) {
  return (
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
            Tagline (used for search/social previews — the hero shows the Hero
            subtitle instead)
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
  );
}

export function HeroEditor({
  form,
  setForm,
  loading,
  videoFiles,
  videoUploads,
  videoPreviewUrls,
  heroVideoInputRef,
  startVideoUpload,
  rejectVideo,
  removeVideo,
  setError,
}: SiteEditorFieldsProps & SiteEditorVideoProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">Hero</h3>
        <p className="mt-1 text-sm text-muted">
          The full-width background video at the top of the home page, plus the
          cursive subtitle shown at the bottom of the hero.
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
          Remember to press &ldquo;Save site content&rdquo; after editing the
          subtitle.
        </span>
      </label>

      <div className="max-w-2xl space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4">
        <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
          Background video
        </p>
        <p className="text-sm text-muted">
          Goes live as soon as you pick a file — no need to press &ldquo;Save
          site content&rdquo;. Use the original 1080p (or higher) file so it
          stays sharp. Portrait or landscape is cropped to fill the hero — it
          is never stretched wide. Without a video, the hero shows the plant
          wallpaper.
        </p>
        <VideoSlotField
          slot="hero"
          videoPath={form.hero.videoPath}
          file={videoFiles.hero}
          previewUrl={videoPreviewUrls.hero}
          state={videoUploads.hero}
          inputRef={heroVideoInputRef}
          disabled={loading}
          onError={setError}
          onSelect={(file) => void startVideoUpload("hero", file)}
          onReject={() => rejectVideo("hero")}
          onRemove={() => void removeVideo("hero")}
        />
      </div>
    </section>
  );
}

export function StatsEditor({
  form,
  setForm,
}: Pick<SiteEditorFieldsProps, "form" | "setForm">) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">Stats banner</h3>
        <p className="mt-1 text-sm text-muted">
          The band directly under the hero video. Add as many figures as you
          like — they spread evenly across the banner.
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
                    items: moveItem(current.statsBanner.items, index, delta),
                  },
                }))
              }
              onRemove={() =>
                setForm((current) => ({
                  ...current,
                  statsBanner: {
                    ...current.statsBanner,
                    items: current.statsBanner.items.filter((_, i) => i !== index),
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
                    items[index] = { ...items[index], value: event.target.value };
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
                    items[index] = { ...items[index], label: event.target.value };
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
  );
}

export function CtaEditor({
  form,
  setForm,
  loading,
  videoFiles,
  videoUploads,
  videoPreviewUrls,
  ctaVideoInputRef,
  startVideoUpload,
  rejectVideo,
  removeVideo,
  setError,
}: SiteEditorFieldsProps & SiteEditorVideoProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">Closing CTA</h3>
        <p className="mt-1 text-sm text-muted">
          The &ldquo;Let&apos;s work together&rdquo; section at the bottom of
          the home page — headline, message, video, and links.
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
          Plays muted on a loop next to the headline. Visitors can unmute it. Use
          the original 1080p (or higher) vertical or 4:5 clip so it fills the
          frame without stretching. Goes live as soon as you pick a file — no
          need to press &ldquo;Save site content&rdquo;.
        </p>
        <VideoSlotField
          slot="cta"
          videoPath={form.closingCta.videoPath}
          file={videoFiles.cta}
          previewUrl={videoPreviewUrls.cta}
          state={videoUploads.cta}
          inputRef={ctaVideoInputRef}
          disabled={loading}
          onError={setError}
          onSelect={(file) => void startVideoUpload("cta", file)}
          onReject={() => rejectVideo("cta")}
          onRemove={() => void removeVideo("cta")}
        />
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
  );
}
