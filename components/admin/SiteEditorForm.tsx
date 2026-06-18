"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/site/types";
import { PHOTO_ACCENTS } from "@/lib/site/accents";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";

type SiteEditorFormProps = {
  onSaved?: (site: SiteContent) => void;
};

type ContentSection = "profile" | "about" | "photos" | "services" | "contact";

const SECTIONS: { id: ContentSection; label: string; hint: string }[] = [
  { id: "profile", label: "Profile", hint: "Name & tagline" },
  { id: "about", label: "About", hint: "Headline & copy" },
  { id: "photos", label: "Photos", hint: "Images & captions" },
  { id: "services", label: "Services", hint: "Offerings list" },
  { id: "contact", label: "Contact", hint: "Social links" },
];

const inputClass =
  "mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown";

export function SiteEditorForm({ onSaved }: SiteEditorFormProps) {
  const { site, setSite } = useAdminView();
  const [form, setForm] = useState(site);
  const [section, setSection] = useState<ContentSection>("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <nav
        aria-label="Site content sections"
        className="shrink-0 border-b border-brown/10 bg-cream/40 md:w-52 md:border-r md:border-b-0 lg:w-56"
      >
        <div className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:gap-0.5 md:overflow-visible md:px-3 md:py-4">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`shrink-0 rounded-xl px-3 py-2 text-left transition md:w-full md:px-3 md:py-2.5 ${
                section === item.id
                  ? "bg-burgundy text-paper"
                  : "text-indigo hover:bg-white/80"
              }`}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              <span
                className={`hidden text-xs md:block ${
                  section === item.id ? "text-paper/75" : "text-muted"
                }`}
              >
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {section === "profile" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Profile</h3>
                <p className="mt-1 text-sm text-muted">
                  How Emily appears in the hero and across the site.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="text-muted">Full name</span>
                  <input
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
                  <input
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
                  <input
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
                  <span className="text-muted">Tagline</span>
                  <textarea
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
          )}

          {section === "about" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">About copy</h3>
                <p className="mt-1 text-sm text-muted">
                  Headline and paragraphs for the About section.
                </p>
              </div>
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
                  className={inputClass}
                />
              </label>
              <div className="grid gap-4 lg:grid-cols-2">
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
                      rows={5}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
            </section>
          )}

          {section === "photos" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">About photos</h3>
                <p className="mt-1 text-sm text-muted">
                  Upload images, captions, and styling for each photo.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {form.about.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4"
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
                            photos[index] = {
                              ...photos[index],
                              caption: event.target.value,
                            };
                            return {
                              ...current,
                              about: { ...current.about, photos },
                            };
                          })
                        }
                        className={inputClass}
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
                              photos[index] = {
                                ...photos[index],
                                accent: event.target.value,
                              };
                              return {
                                ...current,
                                about: { ...current.about, photos },
                              };
                            })
                          }
                          className={inputClass}
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
                          className={inputClass}
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
          )}

          {section === "services" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Services</h3>
                <p className="mt-1 text-sm text-muted">
                  Titles, descriptions, and accent colors for each offering.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {form.services.map((service, index) => (
                  <div
                    key={service.id}
                    className="space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4"
                  >
                    <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                      Service {index + 1}
                    </p>
                    <label className="block text-sm">
                      <span className="text-muted">Title</span>
                      <input
                        value={service.title}
                        onChange={(event) =>
                          setForm((current) => {
                            const services = [...current.services];
                            services[index] = {
                              ...services[index],
                              title: event.target.value,
                            };
                            return { ...current, services };
                          })
                        }
                        className={inputClass}
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
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Accent</span>
                      <select
                        value={service.accent}
                        onChange={(event) =>
                          setForm((current) => {
                            const services = [...current.services];
                            services[index] = {
                              ...services[index],
                              accent: event.target.value,
                            };
                            return { ...current, services };
                          })
                        }
                        className={inputClass}
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
              </div>
            </section>
          )}

          {section === "contact" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Contact</h3>
                <p className="mt-1 text-sm text-muted">
                  Links shown in the footer and contact areas.
                </p>
              </div>
              <div className="grid max-w-2xl gap-4">
                <label className="block text-sm">
                  <span className="text-muted">Instagram URL</span>
                  <input
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
                  <input
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
          )}
        </div>

        <div className="shrink-0 border-t border-brown/10 bg-paper px-4 py-3 sm:px-6">
          {error && (
            <p className="mb-2 rounded-xl bg-pink/15 px-4 py-2 text-sm text-brown">
              {error}
            </p>
          )}
          {message && (
            <p className="mb-2 rounded-xl bg-lavender/25 px-4 py-2 text-sm text-indigo">
              {message}
            </p>
          )}

          <AnimatedButton
            onClick={() => void save()}
            disabled={loading}
            className="w-full shadow-md shadow-burgundy/15 sm:max-w-xs"
          >
            {loading ? "Saving…" : "Save site content"}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
