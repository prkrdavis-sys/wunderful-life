"use client";

import { AdminEditButton } from "@/components/admin/AdminEditButton";
import { SectionButterfly } from "@/components/ui/ButterflyFlight";
import { SectionReveal, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { EmilyPhoto } from "@/components/ui/EmilyPhoto";
import { SectionSurface } from "@/components/ui/SectionSurface";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionText } from "@/lib/sectionText";

export function MoreEmilySection() {
  const site = useSiteContent();
  const text = sectionText.about;
  const galleryPhotos = site.about.photos.slice(2, 6);

  if (galleryPhotos.length === 0) {
    return null;
  }

  return (
    <section
      id="more-emily"
      className="scroll-section-anchor relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-24"
    >
      <SectionSurface tone="ivory" motifs="left" />
      <SectionButterfly flight="aboutFar" />
      <AdminEditButton section="photos" label="Edit photos" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <SectionReveal className="text-center">
          <h2 className={`font-serif text-3xl sm:text-5xl ${text.heading}`}>
            A little more {site.name}
          </h2>
        </SectionReveal>
        <StaggerChildren className="mx-auto mt-8 grid max-w-5xl grid-cols-2 justify-items-center gap-x-6 gap-y-10 sm:mt-10 sm:gap-x-10 lg:grid-cols-4">
          {galleryPhotos.map((photo) => (
            <StaggerItem key={photo.id} className="w-full max-w-[260px] sm:max-w-[290px]">
              <EmilyPhoto photo={photo} size="md" className="mx-auto" />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
