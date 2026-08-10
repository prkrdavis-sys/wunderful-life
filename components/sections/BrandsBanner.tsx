"use client";

import Image from "next/image";
import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { ScallopedBanner } from "@/components/ui/ScallopedBanner";
import { SectionReveal } from "@/components/ui/motion";
import type { BrandItem } from "@/lib/site/types";

function BrandMark({ brand }: { brand: BrandItem }) {
  if (brand.logoPath) {
    return (
      <Image
        src={brand.logoPath}
        alt={brand.name}
        width={160}
        height={48}
        // Logos vary wildly, so normalize height and let width follow.
        className="h-8 w-auto object-contain opacity-90 sm:h-10"
      />
    );
  }

  return (
    <span className="font-label text-sm font-bold tracking-[0.06em] text-paper/90 sm:text-base">
      {brand.name}
    </span>
  );
}

export function BrandsBanner() {
  const { site, viewMode } = useAdminView();
  const isAdminView = viewMode === "admin";
  const { visible, heading, items } = site.brands;

  if (!isAdminView && (!visible || items.length === 0)) return null;

  return (
    <div className="relative">
      <ScallopedBanner motifs="edges" className="pb-4 sm:pb-6">
        <SectionButterfly flight="brandsBand" />
        <AdminEditButton section="brands" label="Edit brands" tone="light" />
        <SectionReveal className="text-center">
          <h2 className="font-script text-3xl text-paper sm:text-5xl">{heading}</h2>

          {items.length === 0 ? (
            <p className="mt-5 font-label text-sm text-paper/70">
              No brands yet — add some in the site editor.
            </p>
          ) : (
            <ul className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:mt-8 sm:justify-between">
              {items.map((brand) => (
                <li key={brand.id} className="flex items-center">
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
          )}
        </SectionReveal>
      </ScallopedBanner>

      {isAdminView && !visible && (
        <p className="bg-honey/30 py-2 text-center font-label text-xs tracking-[0.14em] text-brown uppercase">
          Brands banner hidden from visitors
        </p>
      )}
    </div>
  );
}
