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

  const paragraphClass = `text-base leading-relaxed break-words sm:text-lg ${text.body}`;

  return (
    <section
      id="about"
      className="scroll-section-anchor relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-5xl">
        <SectionReveal className="mb-8 text-center md:mb-9 md:text-left">
          <h2 className={`font-display text-3xl sm:text-4xl ${text.heading}`}>
            {site.about.headline}
          </h2>
          <p className={`mt-2 max-w-xl text-base sm:text-lg ${text.subheading}`}>
            Meet {site.name} — creative, aesthetic, and unapologetically myself.
          </p>
        </SectionReveal>

        <div className="grid items-start gap-8 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:gap-x-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-x-12">
          {mainPhoto && (
            <SectionReveal className="mx-auto w-full max-w-xs md:sticky md:top-28 md:mx-0 md:max-w-none md:self-start">
              <EmilyPhoto photo={mainPhoto} size="lg" />
            </SectionReveal>
          )}

          <div className="min-w-0 space-y-4">
            {leadParagraphs.map((paragraph, index) => (
              <p key={`about-lead-${index}`} className={paragraphClass}>
                {paragraph}
              </p>
            ))}

            {(closingParagraph || accentPhoto) && (
              <div className="flex flex-col gap-5 pt-1 md:flex-row md:items-start md:justify-between md:gap-6 lg:gap-8">
                {closingParagraph && (
                  <p className={`min-w-0 flex-1 md:max-w-[72%] lg:max-w-[68%] ${paragraphClass}`}>
                    {closingParagraph}
                  </p>
                )}

                {accentPhoto && (
                  <SectionReveal
                    className={`mx-auto w-full max-w-[200px] sm:max-w-[220px] md:mx-0 md:shrink-0 md:pt-0.5 ${
                      closingParagraph ? "md:-mt-1 md:ml-auto" : "md:ml-auto"
                    }`}
                  >
                    <EmilyPhoto photo={accentPhoto} size="md" />
                  </SectionReveal>
                )}
              </div>
            )}
          </div>
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
