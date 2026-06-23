"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/site/types";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { FileUploadButton } from "@/components/ui/FileUploadButton";
import {
  useAdminView,
  type SiteEditorSection,
} from "@/components/admin/AdminViewProvider";

type SiteEditorFormProps = {
  onSaved?: (site: SiteContent) => void;
};

const SECTIONS: { id: SiteEditorSection; label: string; hint: string }[] = [
  { id: "profile", label: "Profile", hint: "Name & tagline" },
  { id: "about", label: "About", hint: "Headline & copy" },
  { id: "photos", label: "Photos", hint: "Images & captions" },
  { id: "homeGrid", label: "Home grid", hint: "8 photo slots" },
  { id: "ugc", label: "What is UGC", hint: "Definition & cards" },
  { id: "services", label: "Services", hint: "Offerings list" },
  { id: "testimonials", label: "Testimonials", hint: "Quotes & visibility" },
  { id: "contact", label: "Contact", hint: "Headline, copy & links" },
];

const inputClass =
  "mt-1 w-full rounded-xl border border-brown/20 bg-white px-3 py-2 text-brown";

export function SiteEditorForm({ onSaved }: SiteEditorFormProps) {
  const { site, setSite, editorSection, setEditorSection } = useAdminView();
  const [form, setForm] = useState(site);
  const [section, setSection] = useState<SiteEditorSection>("profile");
  const activeSection = editorSection ?? section;
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

  const uploadPhoto = async (
    photoId: string,
    file: File,
    kind: "about" | "homeGrid" = "about",
  ) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload = new FormData();
      payload.set("photo", file);
      const endpoint =
        kind === "homeGrid"
          ? `/api/site/home-grid-photos/${photoId}`
          : `/api/site/photos/${photoId}`;
      const response = await fetch(endpoint, {
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
              onClick={() => {
                setEditorSection(null);
                setSection(item.id);
              }}
              className={`shrink-0 rounded-xl px-3 py-2 text-left transition md:w-full md:px-3 md:py-2.5 ${
                activeSection === item.id
                  ? "bg-burgundy text-paper"
                  : "text-indigo hover:bg-white/80"
              }`}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              <span
                className={`hidden text-xs md:block ${
                  activeSection === item.id ? "text-paper/75" : "text-muted"
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
          {activeSection === "profile" && (
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

          {activeSection === "about" && (
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
              <div className="space-y-4">
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
                      rows={8}
                      className={`${inputClass} min-h-40 resize-y`}
                    />
                  </label>
                ))}
              </div>
            </section>
          )}

          {activeSection === "photos" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">About photos</h3>
                <p className="mt-1 text-sm text-muted">
                  Upload images, captions, and rotation for each photo.
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
                    <div className="block text-sm">
                      <span className="text-muted">Photo</span>
                      <FileUploadButton
                        className="mt-1"
                        kind="photo"
                        accept="image/*"
                        onChange={(file) => {
                          if (file) void uploadPhoto(photo.id, file);
                        }}
                      />
                      {photo.imagePath && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-lavender/35 px-2.5 py-1 text-xs font-medium text-indigo">
                          <span aria-hidden>🌸</span>
                          Live on your site
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "homeGrid" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">
                  Home photo grid
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Eight clean square images shown under the home page phone
                  slider.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {form.homePhotoGrid.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4"
                  >
                    <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                      Grid photo {index + 1}
                    </p>
                    <label className="block text-sm">
                      <span className="text-muted">Alt text</span>
                      <input
                        value={photo.alt}
                        onChange={(event) =>
                          setForm((current) => {
                            const photos = [...current.homePhotoGrid.photos];
                            photos[index] = {
                              ...photos[index],
                              alt: event.target.value,
                            };
                            return {
                              ...current,
                              homePhotoGrid: {
                                ...current.homePhotoGrid,
                                photos,
                              },
                            };
                          })
                        }
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
                        buttonLabel={photo.imagePath ? "Swap photo" : "Add a photo"}
                        onChange={(file) => {
                          if (file) void uploadPhoto(photo.id, file, "homeGrid");
                        }}
                      />
                      {photo.imagePath && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-lavender/35 px-2.5 py-1 text-xs font-medium text-indigo">
                          <span aria-hidden>🌸</span>
                          Live on your site
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "ugc" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">What is UGC</h3>
                <p className="mt-1 text-sm text-muted">
                  Definition copy and supporting cards for the UGC explainer.
                </p>
              </div>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Section headline</span>
                <input
                  value={form.whatIsUgc.heading}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      whatIsUgc: {
                        ...current.whatIsUgc,
                        heading: event.target.value,
                      },
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Definition</span>
                <textarea
                  value={form.whatIsUgc.body}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      whatIsUgc: {
                        ...current.whatIsUgc,
                        body: event.target.value,
                      },
                    }))
                  }
                  rows={7}
                  className={`${inputClass} min-h-36 resize-y`}
                />
              </label>
              <div className="grid gap-4 lg:grid-cols-3">
                {form.whatIsUgc.highlights.map((highlight, index) => (
                  <div
                    key={highlight.id}
                    className="space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4"
                  >
                    <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                      UGC card {index + 1}
                    </p>
                    <label className="block text-sm">
                      <span className="text-muted">Title</span>
                      <input
                        value={highlight.title}
                        onChange={(event) =>
                          setForm((current) => {
                            const highlights = [...current.whatIsUgc.highlights];
                            highlights[index] = {
                              ...highlights[index],
                              title: event.target.value,
                            };
                            return {
                              ...current,
                              whatIsUgc: {
                                ...current.whatIsUgc,
                                highlights,
                              },
                            };
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Description</span>
                      <textarea
                        value={highlight.description}
                        onChange={(event) =>
                          setForm((current) => {
                            const highlights = [...current.whatIsUgc.highlights];
                            highlights[index] = {
                              ...highlights[index],
                              description: event.target.value,
                            };
                            return {
                              ...current,
                              whatIsUgc: {
                                ...current.whatIsUgc,
                                highlights,
                              },
                            };
                          })
                        }
                        rows={4}
                        className={inputClass}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "services" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Services</h3>
                <p className="mt-1 text-sm text-muted">
                  Titles and descriptions for each offering.
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
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "testimonials" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Testimonials</h3>
                <p className="mt-1 text-sm text-muted">
                  Quotes for social proof. Hide this section from regular view
                  until Emily is ready to publish it.
                </p>
              </div>
              <label className="flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-brown/15 bg-cream/55 p-4 text-sm">
                <span>
                  <span className="block font-semibold text-brown">
                    Show testimonials in regular view
                  </span>
                  <span className="mt-1 block text-muted">
                    Admin view can still preview this section while hidden.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.testimonials.visible}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      testimonials: {
                        ...current.testimonials,
                        visible: event.target.checked,
                      },
                    }))
                  }
                  className="h-5 w-5 accent-burgundy"
                />
              </label>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Section headline</span>
                <input
                  value={form.testimonials.heading}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      testimonials: {
                        ...current.testimonials,
                        heading: event.target.value,
                      },
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Intro</span>
                <textarea
                  value={form.testimonials.intro}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      testimonials: {
                        ...current.testimonials,
                        intro: event.target.value,
                      },
                    }))
                  }
                  rows={4}
                  className={inputClass}
                />
              </label>
              <div className="grid gap-4 lg:grid-cols-2">
                {form.testimonials.items.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className="space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4"
                  >
                    <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                      Testimonial {index + 1}
                    </p>
                    <label className="block text-sm">
                      <span className="text-muted">Quote</span>
                      <textarea
                        value={testimonial.quote}
                        onChange={(event) =>
                          setForm((current) => {
                            const items = [...current.testimonials.items];
                            items[index] = {
                              ...items[index],
                              quote: event.target.value,
                            };
                            return {
                              ...current,
                              testimonials: {
                                ...current.testimonials,
                                items,
                              },
                            };
                          })
                        }
                        rows={5}
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Name</span>
                      <input
                        value={testimonial.name}
                        onChange={(event) =>
                          setForm((current) => {
                            const items = [...current.testimonials.items];
                            items[index] = {
                              ...items[index],
                              name: event.target.value,
                            };
                            return {
                              ...current,
                              testimonials: {
                                ...current.testimonials,
                                items,
                              },
                            };
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Role or context</span>
                      <input
                        value={testimonial.role}
                        onChange={(event) =>
                          setForm((current) => {
                            const items = [...current.testimonials.items];
                            items[index] = {
                              ...items[index],
                              role: event.target.value,
                            };
                            return {
                              ...current,
                              testimonials: {
                                ...current.testimonials,
                                items,
                              },
                            };
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "contact" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Contact</h3>
                <p className="mt-1 text-sm text-muted">
                  The &ldquo;Let&apos;s Create Together&rdquo; section — headline,
                  message, and social links.
                </p>
              </div>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Section headline</span>
                <input
                  value={form.contact.headline}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contact: {
                        ...current.contact,
                        headline: event.target.value,
                      },
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="block max-w-2xl text-sm">
                <span className="text-muted">Message</span>
                <textarea
                  value={form.contact.body}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contact: { ...current.contact, body: event.target.value },
                    }))
                  }
                  rows={8}
                  className={`${inputClass} min-h-40 resize-y`}
                />
              </label>
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
