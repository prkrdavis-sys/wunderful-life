import {
  SectionReveal,
  StaggerChildren,
  StaggerItem,
} from "@/components/ui/motion";
import { EmilyPhoto } from "@/components/ui/EmilyPhoto";
import { WaveDivider } from "@/components/ui/OrganicBlob";
import { getSiteContent } from "@/lib/site";

export function AboutSection() {
  const site = getSiteContent();
  const photos = site.about.photos;
  const mainPhoto = photos[0];
  const accentPhoto = photos[1];
  const galleryPhotos = photos.slice(2);

  return (
    <section
      id="about"
      className="section-wash-green relative scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24"
    >
      <WaveDivider />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionReveal className="mb-10 text-center md:text-left">
          <h2 className="font-display text-3xl text-brown sm:text-4xl">
            {site.about.headline}
          </h2>
          <p className="mt-3 text-muted">
            Meet {site.name} — creative, aesthetic, and unapologetically myself.
          </p>
        </SectionReveal>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <SectionReveal className="flex justify-center lg:justify-start">
            {mainPhoto && (
              <div className="relative">
                <EmilyPhoto photo={mainPhoto} size="lg" />
                <div className="absolute -right-4 -bottom-6 hidden sm:block">
                  {accentPhoto && <EmilyPhoto photo={accentPhoto} size="sm" />}
                </div>
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
          <div className="mt-8 flex flex-wrap items-end justify-center gap-6 sm:gap-8">
            {galleryPhotos.map((photo) => (
              <EmilyPhoto key={photo.id} photo={photo} size="md" />
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
