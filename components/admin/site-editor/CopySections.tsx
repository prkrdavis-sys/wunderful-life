import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";
import { inputClass } from "@/components/admin/site-editor/constants";
import type { SiteEditorFieldsProps } from "@/components/admin/site-editor/types";

export function ServicesEditor({
  form,
  setForm,
}: Pick<SiteEditorFieldsProps, "form" | "setForm">) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">Services</h3>
        <p className="mt-1 text-sm text-muted">
          The section heading and subtitle, plus titles and descriptions for
          each offering.
        </p>
      </div>
      <label className="block max-w-2xl text-sm">
        <span className="text-muted">Section title</span>
        <AutoResizeTextarea
          value={form.services.heading}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              services: {
                ...current.services,
                heading: event.target.value,
              },
            }))
          }
          className={inputClass}
        />
      </label>
      <label className="block max-w-2xl text-sm">
        <span className="text-muted">Subtitle</span>
        <AutoResizeTextarea
          value={form.services.subtitle}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              services: {
                ...current.services,
                subtitle: event.target.value,
              },
            }))
          }
          rows={3}
          className={inputClass}
        />
      </label>
      <div className="grid gap-4 lg:grid-cols-2">
        {form.services.items.map((service, index) => (
          <div
            key={service.id}
            className="space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4"
          >
            <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
              Service {index + 1}
            </p>
            <label className="block text-sm">
              <span className="text-muted">Title</span>
              <AutoResizeTextarea
                value={service.title}
                onChange={(event) =>
                  setForm((current) => {
                    const items = [...current.services.items];
                    items[index] = {
                      ...items[index],
                      title: event.target.value,
                    };
                    return {
                      ...current,
                      services: { ...current.services, items },
                    };
                  })
                }
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Description</span>
              <AutoResizeTextarea
                value={service.description}
                onChange={(event) =>
                  setForm((current) => {
                    const items = [...current.services.items];
                    items[index] = {
                      ...items[index],
                      description: event.target.value,
                    };
                    return {
                      ...current,
                      services: { ...current.services, items },
                    };
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
  );
}

export function TestimonialsEditor({
  form,
  setForm,
}: Pick<SiteEditorFieldsProps, "form" | "setForm">) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">Testimonials</h3>
        <p className="mt-1 text-sm text-muted">
          Quotes for social proof. Hide this section from regular view until
          Emily is ready to publish it.
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
          className="h-5 w-5 accent-forest"
        />
      </label>
      <label className="block max-w-2xl text-sm">
        <span className="text-muted">Section headline</span>
        <AutoResizeTextarea
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
        <AutoResizeTextarea
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
              <AutoResizeTextarea
                value={testimonial.quote}
                onChange={(event) =>
                  setForm((current) => {
                    const items = [...current.testimonials.items];
                    items[index] = { ...items[index], quote: event.target.value };
                    return {
                      ...current,
                      testimonials: { ...current.testimonials, items },
                    };
                  })
                }
                rows={5}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Name</span>
              <AutoResizeTextarea
                value={testimonial.name}
                onChange={(event) =>
                  setForm((current) => {
                    const items = [...current.testimonials.items];
                    items[index] = { ...items[index], name: event.target.value };
                    return {
                      ...current,
                      testimonials: { ...current.testimonials, items },
                    };
                  })
                }
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Role or context</span>
              <AutoResizeTextarea
                value={testimonial.role}
                onChange={(event) =>
                  setForm((current) => {
                    const items = [...current.testimonials.items];
                    items[index] = { ...items[index], role: event.target.value };
                    return {
                      ...current,
                      testimonials: { ...current.testimonials, items },
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
  );
}
