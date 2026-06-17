import {
  SectionReveal,
  StaggerChildren,
  StaggerItem,
} from "@/components/ui/motion";
import { EmilyPhoto } from "@/components/ui/EmilyPhoto";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { sectionWallpapers } from "@/lib/plants";
import { getSiteContent } from "@/lib/site";

export async function AboutSection() {
  const site = await getSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.about;
  const photos = site.about.photos;
  const mainPhoto = photos[0];
  const accentPhoto = photos[1];
  const galleryPhotos = photos.slice(2);

  return (
    <section
      id="about"
      className="relative scroll-mt-24 overflow-hidden px-4 py-20 sm:px-6 sm:py-24"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionReveal className="mb-10 text-center md:text-left">
          <h2 className="font-display text-3xl text-brown sm:text-4xl">
            {site.about.headline}
          </h2>
          <p className="mt-3 text-muted">
            Meet {site.name} — creative, aesthetic, and unapologetically myself.
          </p>
        </SectionReveal>

        <div className="grid gap-12 lg:grid-cols-[auto_1fr] lg:items-start">
          <SectionReveal className="flex justify-center lg:justify-start">
            {(mainPhoto || accentPhoto) && (
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-end sm:gap-10">
                {mainPhoto && <EmilyPhoto photo={mainPhoto} size="xl" />}
                {accentPhoto && <EmilyPhoto photo={accentPhoto} size="md" />}
              </div>
            )}
          </SectionReveal>

          <StaggerChildren className="space-y-4">
            {site.about.paragraphs.map((paragraph) => (
              <StaggerItem key={paragraph.slice(0, 24)}>
                <p className="text-base leading-relaxed text-muted sm:text-lg">
                  {paragraph}
                </p>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>

        <SectionReveal className="mt-16">
          <div className="text-center">
            <h3 className="font-display text-2xl text-brown">
              A little more {site.name}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
              Placeholder photos for now — swap in real images when you&apos;re
              ready so brands can feel your vibe before the first call.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-end justify-center gap-8 sm:gap-10">
            {galleryPhotos.map((photo) => (
              <EmilyPhoto key={photo.id} photo={photo} size="lg" />
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
