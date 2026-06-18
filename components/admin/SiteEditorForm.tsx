"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/site/types";
import { PHOTO_ACCENTS } from "@/lib/site/accents";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";

type SiteEditorFormProps = {
  initial: SiteContent;
  onSaved?: (site: SiteContent) => void;
};

export function SiteEditorForm({ initial, onSaved }: SiteEditorFormProps) {
  const router = useRouter();
  const { setSite } = useAdminView();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm((current) =>
      JSON.stringify(current) === JSON.stringify(initial) ? current : initial,
    );
  }, [initial]);

  const save = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save.");
      }

      setSite(data);
      setForm(data);
      onSaved?.(data);
      setMessage("Saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (photoId: string, file: File) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload = new FormData();
      payload.set("photo", file);
      const response = await fetch(`/api/site/photos/${photoId}`, {
        method: "POST",
        body: payload,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to upload photo.");
      }

      setForm(data);
      setSite(data);
      setMessage("Photo uploaded.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain py-6">
      <section className="space-y-3">
        <h3 className="font-display text-lg text-brown">Profile</h3>
        <label className="block text-sm">
          <span className="text-muted">Full name</span>
          <input
            value={form.fullName}
            onChange={(event) =>
              setForm((current) => ({ ...current, fullName: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">First name</span>
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Brand</span>
          <input
            value={form.brand}
            onChange={(event) =>
              setForm((current) => ({ ...current, brand: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Tagline</span>
          <textarea
            value={form.tagline}
            onChange={(event) =>
              setForm((current) => ({ ...current, tagline: event.target.value }))
            }
            rows={3}
            className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-brown">About Emily</h3>
        <label className="block text-sm">
          <span className="text-muted">Section headline</span>
          <input
            value={form.about.headline}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                about: { ...current.about, headline: event.target.value },
              }))
            }
            className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
          />
        </label>

        {form.about.paragraphs.map((paragraph, index) => (
          <label key={`paragraph-${index}`} className="block text-sm">
            <span className="text-muted">Paragraph {index + 1}</span>
            <textarea
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
              rows={4}
              className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
            />
          </label>
        ))}

        <div className="space-y-4 pt-2">
          <p className="text-sm font-medium text-brown">About photos</p>
          {form.about.photos.map((photo, index) => (
            <div
              key={photo.id}
              className="rounded-2xl border border-brown/15 bg-cream/50 p-4 space-y-3"
            >
              <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                Photo {index + 1}
              </p>
              <label className="block text-sm">
                <span className="text-muted">Caption</span>
                <input
                  value={photo.caption}
                  onChange={(event) =>
                    setForm((current) => {
                      const photos = [...current.about.photos];
                      photos[index] = { ...photos[index], caption: event.target.value };
                      return {
                        ...current,
                        about: { ...current.about, photos },
                      };
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="text-muted">Accent</span>
                  <select
                    value={photo.accent}
                    onChange={(event) =>
                      setForm((current) => {
                        const photos = [...current.about.photos];
                        photos[index] = { ...photos[index], accent: event.target.value };
                        return {
                          ...current,
                          about: { ...current.about, photos },
                        };
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
                  >
                    {PHOTO_ACCENTS.map((accent) => (
                      <option key={accent.value} value={accent.value}>
                        {accent.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-muted">Rotate (deg)</span>
                  <input
                    type="number"
                    value={photo.rotate}
                    onChange={(event) =>
                      setForm((current) => {
                        const photos = [...current.about.photos];
                        photos[index] = {
                          ...photos[index],
                          rotate: Number(event.target.value),
                        };
                        return {
                          ...current,
                          about: { ...current.about, photos },
                        };
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="text-muted">Upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadPhoto(photo.id, file);
                  }}
                  className="mt-1 block w-full text-xs text-muted"
                />
                {photo.imagePath && (
                  <p className="mt-1 truncate text-xs text-burgundy/80">
                    Current: {photo.imagePath}
                  </p>
                )}
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-brown">Services</h3>
        {form.services.map((service, index) => (
          <div
            key={service.id}
            className="rounded-2xl border border-brown/15 bg-cream/50 p-4 space-y-3"
          >
            <label className="block text-sm">
              <span className="text-muted">Title</span>
              <input
                value={service.title}
                onChange={(event) =>
                  setForm((current) => {
                    const services = [...current.services];
                    services[index] = { ...services[index], title: event.target.value };
                    return { ...current, services };
                  })
                }
                className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Description</span>
              <textarea
                value={service.description}
                onChange={(event) =>
                  setForm((current) => {
                    const services = [...current.services];
                    services[index] = {
                      ...services[index],
                      description: event.target.value,
                    };
                    return { ...current, services };
                  })
                }
                rows={3}
                className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Accent</span>
              <select
                value={service.accent}
                onChange={(event) =>
                  setForm((current) => {
                    const services = [...current.services];
                    services[index] = { ...services[index], accent: event.target.value };
                    return { ...current, services };
                  })
                }
                className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
              >
                {PHOTO_ACCENTS.map((accent) => (
                  <option key={accent.value} value={accent.value}>
                    {accent.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-brown">Contact</h3>
        <label className="block text-sm">
          <span className="text-muted">Instagram URL</span>
          <input
            value={form.social.instagram}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                social: { ...current.social, instagram: event.target.value },
              }))
            }
            className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Email link</span>
          <input
            value={form.social.email}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                social: { ...current.social, email: event.target.value },
              }))
            }
            className="mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown"
          />
        </label>
      </section>
      </div>

      <div className="shrink-0 border-t border-brown/10 bg-paper px-1 py-4">
        {error && (
          <p className="mb-3 rounded-xl bg-pink/15 px-4 py-2 text-sm text-brown">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-3 rounded-xl bg-lavender/25 px-4 py-2 text-sm text-indigo">
            {message}
          </p>
        )}

        <AnimatedButton
          onClick={() => void save()}
          disabled={loading}
          className="w-full shadow-md shadow-burgundy/15"
        >
          {loading ? "Saving…" : "Save site content"}
        </AnimatedButton>
      </div>
    </div>
  );
}
