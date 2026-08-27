import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";
import {
  cardClass,
  inputClass,
  smallButtonClass,
} from "@/components/admin/site-editor/constants";
import { AddRowButton, moveItem, RowControls, uniqueId } from "@/components/admin/site-editor/list";
import type { SiteEditorFieldsProps } from "@/components/admin/site-editor/types";

export function UgcEditor({
  form,
  setForm,
}: Pick<SiteEditorFieldsProps, "form" | "setForm">) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">Why UGC</h3>
        <p className="mt-1 text-sm text-muted">
          The merged explainer section: definition copy, proof stats, the big
          callout, and the benefits checklist.
        </p>
      </div>
      <label className="block max-w-2xl text-sm">
        <span className="text-muted">Section headline</span>
        <AutoResizeTextarea
          value={form.whatIsUgc.heading}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              whatIsUgc: { ...current.whatIsUgc, heading: event.target.value },
            }))
          }
          className={inputClass}
        />
      </label>
      <label className="block max-w-2xl text-sm">
        <span className="text-muted">Definition</span>
        <AutoResizeTextarea
          value={form.whatIsUgc.body}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              whatIsUgc: { ...current.whatIsUgc, body: event.target.value },
            }))
          }
          rows={7}
          className={inputClass}
        />
      </label>
      <label className="block max-w-2xl text-sm">
        <span className="text-muted">Eyebrow</span>
        <AutoResizeTextarea
          value={form.ugcBenefits.eyebrow}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              ugcBenefits: {
                ...current.ugcBenefits,
                eyebrow: event.target.value,
              },
            }))
          }
          className={inputClass}
        />
      </label>

      <div>
        <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
          Proof stats (circles)
        </p>
        <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {form.ugcBenefits.stats.map((stat, index) => (
            <div key={stat.id} className={cardClass}>
              <RowControls
                label="Stat"
                index={index}
                count={form.ugcBenefits.stats.length}
                onMove={(delta) =>
                  setForm((current) => ({
                    ...current,
                    ugcBenefits: {
                      ...current.ugcBenefits,
                      stats: moveItem(current.ugcBenefits.stats, index, delta),
                    },
                  }))
                }
                onRemove={() =>
                  setForm((current) => ({
                    ...current,
                    ugcBenefits: {
                      ...current.ugcBenefits,
                      stats: current.ugcBenefits.stats.filter((_, i) => i !== index),
                    },
                  }))
                }
              />
              <label className="block text-sm">
                <span className="text-muted">Figure</span>
                <AutoResizeTextarea
                  value={stat.value}
                  onChange={(event) =>
                    setForm((current) => {
                      const stats = [...current.ugcBenefits.stats];
                      stats[index] = { ...stats[index], value: event.target.value };
                      return {
                        ...current,
                        ugcBenefits: { ...current.ugcBenefits, stats },
                      };
                    })
                  }
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Label</span>
                <AutoResizeTextarea
                  value={stat.label}
                  onChange={(event) =>
                    setForm((current) => {
                      const stats = [...current.ugcBenefits.stats];
                      stats[index] = { ...stats[index], label: event.target.value };
                      return {
                        ...current,
                        ugcBenefits: { ...current.ugcBenefits, stats },
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
        <div className="mt-3">
          <AddRowButton
            label="Add proof stat"
            onClick={() =>
              setForm((current) => ({
                ...current,
                ugcBenefits: {
                  ...current.ugcBenefits,
                  stats: [
                    ...current.ugcBenefits.stats,
                    { id: uniqueId("ugc-stat"), value: "", label: "" },
                  ],
                },
              }))
            }
          />
        </div>
      </div>

      <div className={`${cardClass} max-w-2xl`}>
        <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
          Big callout
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted">Label</span>
            <AutoResizeTextarea
              value={form.ugcBenefits.calloutLabel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  ugcBenefits: {
                    ...current.ugcBenefits,
                    calloutLabel: event.target.value,
                  },
                }))
              }
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Figure</span>
            <AutoResizeTextarea
              value={form.ugcBenefits.calloutValue}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  ugcBenefits: {
                    ...current.ugcBenefits,
                    calloutValue: event.target.value,
                  },
                }))
              }
              className={inputClass}
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-muted">Supporting copy</span>
          <AutoResizeTextarea
            value={form.ugcBenefits.calloutBody}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                ugcBenefits: {
                  ...current.ugcBenefits,
                  calloutBody: event.target.value,
                },
              }))
            }
            rows={3}
            className={inputClass}
          />
        </label>
      </div>

      <div className={`${cardClass} max-w-2xl`}>
        <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
          Benefits checklist
        </p>
        <label className="block text-sm">
          <span className="text-muted">Card eyebrow</span>
          <AutoResizeTextarea
            value={form.ugcBenefits.benefitsEyebrow}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                ugcBenefits: {
                  ...current.ugcBenefits,
                  benefitsEyebrow: event.target.value,
                },
              }))
            }
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Card heading</span>
          <AutoResizeTextarea
            value={form.ugcBenefits.benefitsHeading}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                ugcBenefits: {
                  ...current.ugcBenefits,
                  benefitsHeading: event.target.value,
                },
              }))
            }
            className={inputClass}
          />
        </label>
        {form.ugcBenefits.benefits.map((benefit, index) => (
          <div key={`benefit-${index}`} className="flex items-end gap-2">
            <label className="block flex-1 text-sm">
              <span className="text-muted">Benefit {index + 1}</span>
              <AutoResizeTextarea
                value={benefit}
                onChange={(event) =>
                  setForm((current) => {
                    const benefits = [...current.ugcBenefits.benefits];
                    benefits[index] = event.target.value;
                    return {
                      ...current,
                      ugcBenefits: { ...current.ugcBenefits, benefits },
                    };
                  })
                }
                className={inputClass}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  ugcBenefits: {
                    ...current.ugcBenefits,
                    benefits: current.ugcBenefits.benefits.filter(
                      (_, i) => i !== index,
                    ),
                  },
                }))
              }
              aria-label={`Remove benefit ${index + 1}`}
              className={`${smallButtonClass} mb-2 hover:border-blush-deep/60 hover:text-blush-deep`}
            >
              Remove
            </button>
          </div>
        ))}
        <AddRowButton
          label="Add benefit"
          onClick={() =>
            setForm((current) => ({
              ...current,
              ugcBenefits: {
                ...current.ugcBenefits,
                benefits: [...current.ugcBenefits.benefits, ""],
              },
            }))
          }
        />
      </div>
    </section>
  );
}
