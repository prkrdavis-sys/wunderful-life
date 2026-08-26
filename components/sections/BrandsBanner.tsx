"use client";

import Image from "next/image";
import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { DecorMotifs } from "@/components/ui/DecorMotifs";
import { SectionReveal } from "@/components/ui/motion";
import { MAX_BRANDS, type BrandItem } from "@/lib/site/types";

function BrandMark({ brand }: { brand: BrandItem }) {
  if (brand.logoPath) {
    return (
      <Image
        src={brand.logoPath}
        alt={brand.name}
        width={160}
        height={48}
        className="max-h-full max-w-full object-contain opacity-90"
      />
    );
  }

  return (
    <span className="line-clamp-2 text-center font-label text-xs font-bold tracking-[0.06em] text-forest sm:text-sm">
      {brand.name}
    </span>
  );
}

export function BrandsBanner() {
  const { site, viewMode } = useAdminView();
  const isAdminView = viewMode === "admin";
  const { visible, heading, items: allItems } = site.brands;
  const items = allItems.slice(0, MAX_BRANDS);

  if (!isAdminView && (!visible || items.length === 0)) return null;

  return (
    <section
      id="brands"
      aria-labelledby="brands-heading"
      className="ugc-brands-section scroll-section-anchor relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24"
    >
      <DecorMotifs preset="scatter" tone="paper" />
      <AdminEditButton section="brands" label="Edit brands" tone="light" />
      <SectionButterfly flight="brandsBand" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <h2
            id="brands-heading"
            className="font-serif text-4xl tracking-tight text-paper sm:text-6xl"
          >
            {heading}
          </h2>
        </SectionReveal>

        {items.length === 0 ? (
          <p className="mt-8 text-center font-label text-sm text-paper/70">
            No brands yet — add some in the site editor.
          </p>
        ) : (
          <SectionReveal
            delay={0.12}
            className="ugc-benefits-card mx-auto mt-10 max-w-5xl rounded-[2rem] border border-paper/40 p-6 text-ink shadow-xl sm:mt-12 sm:p-8"
          >
            <ul className="ugc-brands-list">
              {items.map((brand) => (
                <li key={brand.id} className="ugc-brands-item">
                  {brand.url ? (
                    <a
                      href={brand.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:opacity-75"
                    >
                      <BrandMark brand={brand} />
                    </a>
                  ) : (
                    <BrandMark brand={brand} />
                  )}
                </li>
              ))}
            </ul>
          </SectionReveal>
        )}

        {isAdminView && !visible && (
          <p className="mt-8 text-center font-label text-xs tracking-[0.14em] text-paper/80 uppercase">
            Brands section hidden from visitors
          </p>
        )}
      </div>
    </section>
  );
}
