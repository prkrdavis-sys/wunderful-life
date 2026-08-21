import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { cardClass, inputClass } from "@/components/admin/site-editor/constants";
import { AddRowButton, moveItem, RowControls, uniqueId } from "@/components/admin/site-editor/list";
import { LiveOnSiteNote } from "@/components/admin/site-editor/LiveOnSiteNote";
import type { SiteEditorFieldsProps } from "@/components/admin/site-editor/types";
import { FileUploadButton } from "@/components/ui/FileUploadButton";

export function BrandsEditor({
  form,
  setForm,
  loading,
  uploadPhoto,
  removePhoto,
}: SiteEditorFieldsProps) {
  const { site } = useAdminView();
  const savedBrandIds = new Set(site.brands.items.map((brand) => brand.id));

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">
          Brands I&apos;ve worked with
        </h3>
        <p className="mt-1 text-sm text-muted">
          The brand list that sits under What Is UGC. Upload a logo, or leave it
          empty to show the brand name as text.
        </p>
      </div>

      <label className="flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-brown/15 bg-cream/55 p-4 text-sm">
        <span>
          <span className="block font-semibold text-brown">
            Show the brands section
          </span>
          <span className="mt-1 block text-muted">
            Admin view still previews it while hidden.
          </span>
        </span>
        <input
          type="checkbox"
          checked={form.brands.visible}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              brands: { ...current.brands, visible: event.target.checked },
            }))
          }
          className="h-5 w-5 accent-forest"
        />
      </label>

      <label className="block max-w-2xl text-sm">
        <span className="text-muted">Section headline</span>
        <AutoResizeTextarea
          value={form.brands.heading}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              brands: { ...current.brands, heading: event.target.value },
            }))
          }
          className={inputClass}
        />
      </label>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        {form.brands.items.map((brand, index) => (
          <div key={brand.id} className={cardClass}>
            <RowControls
              label="Brand"
              index={index}
              count={form.brands.items.length}
              onMove={(delta) =>
                setForm((current) => ({
                  ...current,
                  brands: {
                    ...current.brands,
                    items: moveItem(current.brands.items, index, delta),
                  },
                }))
              }
              onRemove={() =>
                setForm((current) => ({
                  ...current,
                  brands: {
                    ...current.brands,
                    items: current.brands.items.filter((_, i) => i !== index),
                  },
                }))
              }
            />
            <label className="block text-sm">
              <span className="text-muted">Brand name</span>
              <AutoResizeTextarea
                value={brand.name}
                onChange={(event) =>
                  setForm((current) => {
                    const items = [...current.brands.items];
                    items[index] = { ...items[index], name: event.target.value };
                    return { ...current, brands: { ...current.brands, items } };
                  })
                }
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Link (optional)</span>
              <AutoResizeTextarea
                value={brand.url ?? ""}
                placeholder="https://"
                onChange={(event) =>
                  setForm((current) => {
                    const items = [...current.brands.items];
                    items[index] = { ...items[index], url: event.target.value };
                    return { ...current, brands: { ...current.brands, items } };
                  })
                }
                className={inputClass}
              />
            </label>
            <div className="block text-sm">
              <span className="text-muted">Logo (optional)</span>
              {savedBrandIds.has(brand.id) ? (
                <>
                  <FileUploadButton
                    className="mt-1"
                    kind="photo"
                    accept="image/*"
                    selectedName={brand.logoPath}
                    previewUrl={brand.logoPath}
                    buttonLabel={brand.logoPath ? "Swap logo" : "Add a logo"}
                    disabled={loading}
                    onChange={(file) => {
                      if (file) void uploadPhoto(brand.id, file, "brandLogo");
                    }}
                    onRemove={
                      brand.logoPath
                        ? () => {
                            void removePhoto(brand.id, "brandLogo");
                          }
                        : undefined
                    }
                  />
                  {brand.logoPath && (
                    <LiveOnSiteNote>Live on your site</LiveOnSiteNote>
                  )}
                </>
              ) : (
                <p className="mt-1 rounded-xl bg-honey/25 px-3 py-2 text-xs text-brown">
                  Save the site content first, then upload a logo here.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <AddRowButton
        label="Add brand"
        onClick={() =>
          setForm((current) => ({
            ...current,
            brands: {
              ...current.brands,
              items: [
                ...current.brands.items,
                { id: uniqueId("brand"), name: "New brand" },
              ],
            },
          }))
        }
      />
    </section>
  );
}
