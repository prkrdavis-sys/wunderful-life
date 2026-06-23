import type { AboutPhoto, GridPhoto, SiteContent } from "@/lib/site/types";

const DEFAULT_CONTACT_HEADLINE = "Let's Create Together";

const DEFAULT_WHAT_IS_UGC: SiteContent["whatIsUgc"] = {
  heading: "What Is UGC?",
  body: "UGC, or user-generated content, is brand content made to feel like it came from a real customer, creator, or everyday experience. It blends strategy with natural storytelling, helping people understand how a product fits into real life without feeling like a traditional ad.",
  highlights: [
    {
      id: "authenticity",
      title: "Authentic by design",
      description:
        "It sounds human, feels relaxed, and lets the product live inside a believable moment.",
    },
    {
      id: "conversion",
      title: "Built for trust",
      description:
        "Strong UGC gives shoppers social proof, clear benefits, and an easy reason to keep watching.",
    },
    {
      id: "versatility",
      title: "Ready for every channel",
      description:
        "Use it across organic social, paid ads, product pages, emails, and launch campaigns.",
    },
  ],
};

const DEFAULT_TESTIMONIALS: SiteContent["testimonials"] = {
  visible: true,
  heading: "Kind Words",
  intro:
    "A few example notes to show how client feedback can live here once Emily starts collecting testimonials.",
  items: [
    {
      id: "warm-natural",
      quote:
        "Emily brought such a warm, natural presence to the content. The video felt polished without losing that real-life charm.",
      name: "Sample Brand Partner",
      role: "Lifestyle campaign",
    },
    {
      id: "easy-collaboration",
      quote:
        "The creative direction was thoughtful, on-brand, and easy to use across our social channels.",
      name: "Example Client",
      role: "Wellness launch",
    },
  ],
};

const DEFAULT_FOURTH_GALLERY_PHOTO: AboutPhoto = {
  id: "ugc-moment",
  caption: "New UGC moment — upload Emily's fourth gallery photo here",
  rotate: 3,
};

const DEFAULT_HOME_GRID_PHOTOS: GridPhoto[] = Array.from(
  { length: 8 },
  (_, index) => ({
    id: `home-grid-${index + 1}`,
    alt: `Home photo grid image ${index + 1}`,
  }),
);

type SiteContentInput = Omit<
  SiteContent,
  "contact" | "homePhotoGrid" | "whatIsUgc" | "testimonials"
> & {
  contact?: Partial<SiteContent["contact"]>;
  homePhotoGrid?: Partial<SiteContent["homePhotoGrid"]>;
  whatIsUgc?: Partial<SiteContent["whatIsUgc"]>;
  testimonials?: Partial<SiteContent["testimonials"]>;
};

function defaultContactBody(name: string): string {
  return `Want content that converts and a creator brands actually want to work with again? Hi — I'm ${name}. Let's chat.`;
}

function normalizeAboutPhotos(photos: AboutPhoto[]): AboutPhoto[] {
  const normalized = photos.map((photo) => ({
    id: photo.id,
    caption: photo.caption,
    rotate: photo.rotate,
    ...(photo.imagePath ? { imagePath: photo.imagePath } : {}),
  }));

  if (
    normalized.length < 6 &&
    !normalized.some((photo) => photo.id === DEFAULT_FOURTH_GALLERY_PHOTO.id)
  ) {
    return [...normalized, DEFAULT_FOURTH_GALLERY_PHOTO];
  }

  return normalized;
}

function normalizeHeroLinks(links: SiteContent["heroLinks"]): SiteContent["heroLinks"] {
  return links.map((link) => {
    if (link.activePathPrefix === "/work" || link.href === "/#work") {
      return {
        ...link,
        href: "/work",
      };
    }

    return link;
  });
}

function normalizeHomeGridPhotos(
  photos: GridPhoto[] | undefined,
): GridPhoto[] {
  const byId = new Map((photos ?? []).map((photo) => [photo.id, photo]));

  return DEFAULT_HOME_GRID_PHOTOS.map((fallback) => {
    const photo = byId.get(fallback.id);
    if (!photo) return fallback;

    return {
      id: fallback.id,
      alt: typeof photo.alt === "string" ? photo.alt : fallback.alt,
      ...(photo.imagePath ? { imagePath: photo.imagePath } : {}),
    };
  });
}

export function normalizeSiteContent(raw: SiteContentInput): SiteContent {
  const whatIsUgc = raw.whatIsUgc ?? DEFAULT_WHAT_IS_UGC;
  const testimonials = raw.testimonials ?? DEFAULT_TESTIMONIALS;

  return {
    fullName: raw.fullName,
    name: raw.name,
    brand: raw.brand,
    tagline: raw.tagline,
    about: {
      headline: raw.about.headline,
      paragraphs: raw.about.paragraphs,
      photos: normalizeAboutPhotos(raw.about.photos),
    },
    homePhotoGrid: {
      photos: normalizeHomeGridPhotos(raw.homePhotoGrid?.photos),
    },
    whatIsUgc: {
      heading:
        typeof whatIsUgc.heading === "string"
          ? whatIsUgc.heading
          : DEFAULT_WHAT_IS_UGC.heading,
      body:
        typeof whatIsUgc.body === "string"
          ? whatIsUgc.body
          : DEFAULT_WHAT_IS_UGC.body,
      highlights: Array.isArray(whatIsUgc.highlights)
        ? whatIsUgc.highlights.map((highlight, index) => ({
            id:
              typeof highlight.id === "string"
                ? highlight.id
                : `highlight-${index + 1}`,
            title:
              typeof highlight.title === "string"
                ? highlight.title
                : DEFAULT_WHAT_IS_UGC.highlights[index]?.title ?? "",
            description:
              typeof highlight.description === "string"
                ? highlight.description
                : DEFAULT_WHAT_IS_UGC.highlights[index]?.description ?? "",
          }))
        : DEFAULT_WHAT_IS_UGC.highlights,
    },
    heroLinks: normalizeHeroLinks(raw.heroLinks),
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
    testimonials: {
      visible:
        typeof testimonials.visible === "boolean"
          ? testimonials.visible
          : DEFAULT_TESTIMONIALS.visible,
      heading:
        typeof testimonials.heading === "string"
          ? testimonials.heading
          : DEFAULT_TESTIMONIALS.heading,
      intro:
        typeof testimonials.intro === "string"
          ? testimonials.intro
          : DEFAULT_TESTIMONIALS.intro,
      items: Array.isArray(testimonials.items)
        ? testimonials.items.map((testimonial, index) => ({
            id:
              typeof testimonial.id === "string"
                ? testimonial.id
                : `testimonial-${index + 1}`,
            quote:
              typeof testimonial.quote === "string"
                ? testimonial.quote
                : DEFAULT_TESTIMONIALS.items[index]?.quote ?? "",
            name:
              typeof testimonial.name === "string"
                ? testimonial.name
                : DEFAULT_TESTIMONIALS.items[index]?.name ?? "",
            role:
              typeof testimonial.role === "string"
                ? testimonial.role
                : DEFAULT_TESTIMONIALS.items[index]?.role ?? "",
          }))
        : DEFAULT_TESTIMONIALS.items,
    },
  };
}
