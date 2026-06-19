import type { SiteContent } from "@/lib/site/types";

const DEFAULT_CONTACT_HEADLINE = "Let's Create Together";

type SiteContentInput = Omit<SiteContent, "contact"> & {
  contact?: Partial<SiteContent["contact"]>;
};

function defaultContactBody(name: string): string {
  return `Want content that converts and a creator brands actually want to work with again? Hi — I'm ${name}. Let's chat.`;
}

export function normalizeSiteContent(raw: SiteContentInput): SiteContent {
  return {
    fullName: raw.fullName,
    name: raw.name,
    brand: raw.brand,
    tagline: raw.tagline,
    about: {
      headline: raw.about.headline,
      paragraphs: raw.about.paragraphs,
      photos: raw.about.photos.map((photo) => ({
        id: photo.id,
        caption: photo.caption,
        rotate: photo.rotate,
        ...(photo.imagePath ? { imagePath: photo.imagePath } : {}),
      })),
    },
    heroLinks: raw.heroLinks,
    contact: {
      headline:
        typeof raw.contact?.headline === "string" && raw.contact.headline.trim()
          ? raw.contact.headline
          : DEFAULT_CONTACT_HEADLINE,
      body:
        typeof raw.contact?.body === "string" && raw.contact.body.trim()
          ? raw.contact.body
          : defaultContactBody(raw.name),
    },
    social: raw.social,
    services: raw.services.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
    })),
  };
}
