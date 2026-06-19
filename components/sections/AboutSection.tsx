"use client";

import { SectionReveal } from "@/components/ui/motion";
import { EmilyPhoto } from "@/components/ui/EmilyPhoto";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { useSiteContent } from "@/components/admin/AdminViewProvider";
import { sectionWallpapers } from "@/lib/plants";
import { sectionText } from "@/lib/sectionText";

export function AboutSection() {
  const site = useSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.about;
  const text = sectionText.about;
  const photos = site.about.photos;
  const mainPhoto = photos[0];
  const accentPhoto = photos[1];
  const galleryPhotos = photos.slice(2);
  const paragraphs = site.about.paragraphs;
  const leadParagraphs =
    paragraphs.length > 1 ? paragraphs.slice(0, -1) : paragraphs;
  const closingParagraph =
    paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : null;

  return (
    <section
      id="about"
      className="scroll-section-anchor relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-5xl">
        <SectionReveal className="mb-8 text-center md:mb-10 md:text-left">
          <h2 className={`font-display text-3xl sm:text-4xl ${text.heading}`}>
            {site.about.headline}
          </h2>
          <p className={`mt-2 max-w-xl text-base sm:text-lg ${text.subheading}`}>
            Meet {site.name} — creative, aesthetic, and unapologetically myself.
          </p>
        </SectionReveal>

        <div className="grid gap-8 md:grid-cols-2 md:grid-rows-[auto_auto] md:items-start md:gap-x-12 md:gap-y-8 lg:gap-x-14">
          {mainPhoto && (
            <SectionReveal className="mx-auto w-full max-w-xs md:col-start-1 md:row-start-1 md:mx-0 md:max-w-none">
              <EmilyPhoto photo={mainPhoto} size="lg" />
            </SectionReveal>
          )}

          {leadParagraphs.length > 0 && (
            <div className="min-w-0 space-y-4 md:col-start-2 md:row-start-1 md:self-start">
              {leadParagraphs.map((paragraph, index) => (
                <p
                  key={`about-lead-${index}`}
                  className={`text-base leading-relaxed break-words sm:text-lg ${text.body}`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {closingParagraph && (
            <p
              className={`min-w-0 text-base leading-relaxed break-words sm:text-lg md:col-start-1 md:row-start-2 md:self-end ${text.body}`}
            >
              {closingParagraph}
            </p>
          )}

          {accentPhoto && (
            <SectionReveal className="mx-auto w-full max-w-[220px] sm:max-w-[250px] md:col-start-2 md:row-start-2 md:mx-0 md:ml-auto md:self-end">
              <EmilyPhoto photo={accentPhoto} size="md" />
            </SectionReveal>
          )}
        </div>

        {galleryPhotos.length > 0 && (
          <SectionReveal className="mt-12 md:mt-14">
            <h3 className={`font-display text-xl sm:text-2xl ${text.heading}`}>
              A little more {site.name}
            </h3>
            <div className="mt-6 flex flex-wrap gap-6 sm:gap-8">
              {galleryPhotos.map((photo) => (
                <EmilyPhoto key={photo.id} photo={photo} size="md" />
              ))}
            </div>
          </SectionReveal>
        )}
      </div>
    </section>
  );
}
