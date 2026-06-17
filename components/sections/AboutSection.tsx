import {
  SectionReveal,
  StaggerChildren,
  StaggerItem,
} from "@/components/ui/motion";
import { EmilyPhoto } from "@/components/ui/EmilyPhoto";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { sectionWallpapers } from "@/lib/plants";
import { sectionText } from "@/lib/sectionText";
import { getSiteContent } from "@/lib/site";

export async function AboutSection() {
  const site = await getSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.about;
  const text = sectionText.about;
  const photos = site.about.photos;
  const mainPhoto = photos[0];
  const accentPhoto = photos[1];
  const galleryPhotos = photos.slice(2);

  return (
    <section
      id="about"
      className="relative scroll-mt-24 overflow-hidden px-4 py-16 sm:px-6 sm:py-24"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-5xl">
        <SectionReveal className="mb-10 text-center md:mb-12 md:text-left">
          <h2 className={`font-display text-3xl sm:text-4xl ${text.heading}`}>
            {site.about.headline}
          </h2>
          <p className={`mt-3 max-w-xl text-base sm:text-lg ${text.subheading}`}>
            Meet {site.name} — creative, aesthetic, and unapologetically myself.
          </p>
        </SectionReveal>

        <div className="grid gap-10 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-start md:gap-12 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-14">
          {(mainPhoto || accentPhoto) && (
            <SectionReveal className="mx-auto flex w-full max-w-xs flex-col items-center gap-6 md:mx-0 md:max-w-none md:items-start">
              {mainPhoto && <EmilyPhoto photo={mainPhoto} size="lg" />}
              {accentPhoto && <EmilyPhoto photo={accentPhoto} size="md" />}
            </SectionReveal>
          )}

          <StaggerChildren className="min-w-0 space-y-4">
            {site.about.paragraphs.map((paragraph) => (
              <StaggerItem key={paragraph.slice(0, 24)}>
                <p className={`text-base leading-relaxed sm:text-lg ${text.body}`}>
                  {paragraph}
                </p>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>

        {galleryPhotos.length > 0 && (
          <SectionReveal className="mt-14 md:mt-16">
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
