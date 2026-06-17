import {
  SectionReveal,
  StaggerChildren,
  StaggerItem,
} from "@/components/ui/motion";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { sectionWallpapers } from "@/lib/plants";
import { getSiteContent } from "@/lib/site";

const accentMap = {
  green: "border-green/25 bg-white/85",
  blue: "border-blue/20 bg-white/85",
  yellow: "border-yellow-deep/25 bg-white/85",
  pink: "border-pink/25 bg-white/85",
  brown: "border-brown-light/25 bg-white/85",
} as const;

export async function ServicesSection() {
  const site = await getSiteContent();
  const { wallpaper, overlay } = sectionWallpapers.services;

  return (
    <section
      id="services"
      className="relative scroll-mt-24 overflow-hidden px-4 py-20 sm:px-6 sm:py-24"
    >
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionReveal className="text-center">
          <h2 className="font-display text-3xl text-brown sm:text-4xl">
            Services
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted">
            What {site.name} delivers — plus the creative, airy, nature-driven
            personality your audience will remember.
          </p>
        </SectionReveal>

        <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2">
          {site.services.map((service) => {
            const accent =
              accentMap[service.accent as keyof typeof accentMap] ??
              accentMap.green;
            return (
              <StaggerItem key={service.id}>
                <article
                  className={`rounded-3xl border ${accent} p-6 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <h3 className="font-display text-xl text-brown">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                    {service.description}
                  </p>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
}
