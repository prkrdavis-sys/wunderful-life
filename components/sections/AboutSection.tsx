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
  const [leadParagraph, ...restParagraphs] = site.about.paragraphs;

  return (
    <section
      id="about"
      className="relative scroll-mt-24 overflow-hidden px-4 py-24 sm:px-6 sm:py-32"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionReveal className="mb-14 text-center lg:mb-20">
          <h2 className={`font-display text-4xl sm:text-5xl ${text.heading}`}>
            {site.about.headline}
          </h2>
          <p className={`mx-auto mt-4 max-w-2xl text-lg sm:text-xl ${text.subheading}`}>
            Meet {site.name} — creative, aesthetic, and unapologetically myself.
          </p>
        </SectionReveal>

        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-10 xl:gap-x-20">
          {mainPhoto && (
            <SectionReveal className="lg:col-span-6 xl:col-span-5">
              <EmilyPhoto
                photo={mainPhoto}
                size="hero"
                className="mx-auto lg:mx-0"
              />
            </SectionReveal>
          )}

          <div className="flex flex-col justify-center gap-6 lg:col-span-6 lg:py-6 xl:col-span-7">
            {leadParagraph && (
              <SectionReveal>
                <p
                  className={`font-serif text-xl leading-relaxed sm:text-2xl sm:leading-relaxed ${text.body}`}
                >
                  {leadParagraph}
                </p>
              </SectionReveal>
            )}
            {restParagraphs[0] && (
              <StaggerChildren>
                <StaggerItem>
                  <p className={`text-base leading-relaxed sm:text-lg ${text.body}`}>
                    {restParagraphs[0]}
                  </p>
                </StaggerItem>
              </StaggerChildren>
            )}
          </div>

          {restParagraphs[1] && (
            <StaggerChildren className="order-last flex flex-col justify-center lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-2">
              <StaggerItem>
                <p className={`text-base leading-relaxed sm:text-lg ${text.body}`}>
                  {restParagraphs[1]}
                </p>
              </StaggerItem>
            </StaggerChildren>
          )}

          {accentPhoto && (
            <SectionReveal className="order-last lg:order-none lg:col-span-6 lg:col-start-7 lg:row-start-2 xl:col-span-5 xl:col-start-8">
              <EmilyPhoto
                photo={accentPhoto}
                size="xl"
                className="mx-auto lg:ml-auto lg:mr-0"
              />
            </SectionReveal>
          )}
        </div>

        {galleryPhotos.length > 0 && (
          <SectionReveal className="mt-20 lg:mt-28">
            <h3 className={`text-center font-display text-2xl sm:text-3xl ${text.heading}`}>
              A little more {site.name}
            </h3>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {galleryPhotos.map((photo) => (
                <EmilyPhoto key={photo.id} photo={photo} size="gallery" />
              ))}
            </div>
          </SectionReveal>
        )}
      </div>
    </section>
  );
}
