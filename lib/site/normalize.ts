import type {
  AboutPhoto,
  BrandItem,
  CollagePhoto,
  CollagePhotoShape,
  GridPhoto,
  SiteContent,
  StatItem,
} from "@/lib/site/types";

const DEFAULT_CTA_HEADLINE = "Let's work together";
const DEFAULT_CTA_EMAIL_LABEL = "email@email.com";

function defaultHeroSubtitle(name: string): string {
  return `I'm ${name} — the face behind the frame. Brands hire me for deliverables; they remember me for the personality.`;
}

const DEFAULT_STATS_BANNER: SiteContent["statsBanner"] = {
  visible: true,
  items: [
    { id: "instagram", value: "10k", label: "Instagram" },
    { id: "tiktok", value: "9k", label: "Tiktok" },
    { id: "reach", value: "300k", label: "Avg. Reach" },
    { id: "engagement", value: "9.5%", label: "Avg. Engagement" },
  ],
};

const DEFAULT_WORK: SiteContent["work"] = {
  heading: "My most recent videos",
};

const DEFAULT_PHOTOGRAPHY_LABEL = "photography";

/** Repeating rhythm applied to collage tiles that have no shape saved yet. */
const COLLAGE_SHAPE_CYCLE: CollagePhotoShape[] = [
  "tall",
  "square",
  "square",
  "wide",
  "square",
  "tall",
  "wide",
  "square",
  "square",
  "tall",
];

const DEFAULT_COLLAGE_PHOTOS: CollagePhoto[] = COLLAGE_SHAPE_CYCLE.map(
  (shape, index) => ({
    id: `collage-${index + 1}`,
    alt: `Photography collage image ${index + 1}`,
    shape,
  }),
);

const DEFAULT_BRANDS: SiteContent["brands"] = {
  visible: true,
  heading: "Brands I've worked with",
  items: [
    { id: "brand-1", name: "Brand 1" },
    { id: "brand-2", name: "Brand 2" },
    { id: "brand-3", name: "Brand 3" },
    { id: "brand-4", name: "Brand 4" },
  ],
};

const DEFAULT_WHAT_IS_UGC: SiteContent["whatIsUgc"] = {
  heading: "What Is UGC?",
  body: "UGC, or user-generated content, is brand content made to feel like it came from a real customer, creator, or everyday experience. It blends strategy with natural storytelling, helping people understand how a product fits into real life without feeling like a traditional ad.",
};

const DEFAULT_UGC_BENEFITS: SiteContent["ugcBenefits"] = {
  eyebrow: "The power of real stories",
  stats: [
    {
      id: "authentic",
      value: "2.4×",
      label: "more likely to be viewed as authentic",
    },
    {
      id: "trustworthy",
      value: "73%",
      label: "of shoppers say UGC makes a brand feel more trustworthy",
    },
    {
      id: "influences",
      value: "79%",
      label: "of people say UGC strongly influences what they buy",
    },
  ],
  calloutLabel: "Did you know?",
  calloutValue: "93%",
  calloutBody:
    "of marketers say authentic content performs better than traditional brand-made content.",
  benefitsHeading: "Content that feels like a recommendation.",
  benefits: [
    "Builds trust with real stories",
    "Creates natural engagement",
    "Boosts conversions across channels",
    "Makes your brand feel human",
    "Authentic by design — the product lives in a believable moment",
    "Ready for organic social, paid ads, product pages, and launches",
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

const UGC_LINK: SiteContent["heroLinks"][number] = {
  label: "Why UGC",
  href: "/#ugc",
};

/** Older anchors that the merged UGC section now owns. */
const LEGACY_UGC_HREFS = new Set(["/#ugc-benefits", "/#what-is-ugc"]);

type SiteContentInput = Omit<
  SiteContent,
  | "statsBanner"
  | "work"
  | "photography"
  | "brands"
  | "whatIsUgc"
  | "ugcBenefits"
  | "closingCta"
  | "testimonials"
  | "hero"
> & {
  statsBanner?: Partial<SiteContent["statsBanner"]>;
  work?: Partial<SiteContent["work"]>;
  photography?: Partial<SiteContent["photography"]>;
  brands?: Partial<SiteContent["brands"]>;
  whatIsUgc?: Partial<SiteContent["whatIsUgc"]>;
  ugcBenefits?: Partial<SiteContent["ugcBenefits"]>;
  closingCta?: Partial<SiteContent["closingCta"]>;
  testimonials?: Partial<SiteContent["testimonials"]>;
  hero?: Partial<SiteContent["hero"]>;
  /** Superseded by `photography`; still read so old saves migrate. */
  homePhotoGrid?: { photos?: GridPhoto[] };
  /** Superseded by `closingCta`. */
  contact?: { headline?: string; body?: string };
};

function defaultCtaBody(name: string): string {
  return `Want content that converts and a creator brands actually want to work with again? Hi — I'm ${name}. Let's chat.`;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function slugId(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
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

function normalizeHeroLinks(
  links: SiteContent["heroLinks"],
): SiteContent["heroLinks"] {
  const seen = new Set<string>();
  const normalized: SiteContent["heroLinks"] = [];

  for (const link of links) {
    let next = link;

    if (link.activePathPrefix === "/work" || link.href === "/#work") {
      next = { ...link, href: "/work" };
    } else if (LEGACY_UGC_HREFS.has(link.href)) {
      next = { ...link, label: UGC_LINK.label, href: UGC_LINK.href };
    } else if (link.href === "/#contact") {
      next = { ...link, href: "/#contact" };
    }

    if (seen.has(next.href)) continue;
    seen.add(next.href);
    normalized.push(next);
  }

  if (!seen.has(UGC_LINK.href)) {
    normalized.push(UGC_LINK);
  }

  return normalized;
}

/**
 * An explicitly empty array is respected so the admin can clear a list; only a
 * missing or malformed value falls back to the seeded defaults.
 */
function normalizeStats(
  items: unknown,
  fallback: StatItem[],
  idPrefix: string,
): StatItem[] {
  if (!Array.isArray(items)) return fallback;

  return items
    .map((item, index): StatItem | null => {
      if (!item || typeof item !== "object") return null;
      const stat = item as Partial<StatItem>;
      const label = text(stat.label, "");
      const value = text(stat.value, "");
      if (!label && !value) return null;

      return {
        id: text(stat.id, `${idPrefix}-${index + 1}`),
        value,
        label,
      };
    })
    .filter((item): item is StatItem => item !== null);
}

function normalizeCollagePhotos(
  photos: unknown,
  legacyGrid: GridPhoto[] | undefined,
): CollagePhoto[] {
  if (Array.isArray(photos) && photos.length > 0) {
    return photos
      .map((item, index): CollagePhoto | null => {
        if (!item || typeof item !== "object") return null;
        const photo = item as Partial<CollagePhoto>;
        const shape: CollagePhotoShape =
          photo.shape === "tall" || photo.shape === "wide" || photo.shape === "square"
            ? photo.shape
            : COLLAGE_SHAPE_CYCLE[index % COLLAGE_SHAPE_CYCLE.length];

        return {
          id: text(photo.id, `collage-${index + 1}`),
          alt: text(photo.alt, `Photography collage image ${index + 1}`),
          shape,
          ...(photo.imagePath ? { imagePath: photo.imagePath } : {}),
        };
      })
      .filter((photo): photo is CollagePhoto => photo !== null);
  }

  // Migration: carry the old 8-slot home grid (and any uploads) into the collage.
  if (Array.isArray(legacyGrid) && legacyGrid.length > 0) {
    return legacyGrid.map((photo, index) => ({
      id: text(photo.id, `collage-${index + 1}`),
      alt: text(photo.alt, `Photography collage image ${index + 1}`),
      shape: COLLAGE_SHAPE_CYCLE[index % COLLAGE_SHAPE_CYCLE.length],
      ...(photo.imagePath ? { imagePath: photo.imagePath } : {}),
    }));
  }

  return DEFAULT_COLLAGE_PHOTOS;
}

function normalizeBrands(items: unknown): BrandItem[] {
  if (!Array.isArray(items)) return DEFAULT_BRANDS.items;

  return items
    .map((item, index): BrandItem | null => {
      if (!item || typeof item !== "object") return null;
      const brand = item as Partial<BrandItem>;
      const name = text(brand.name, "");
      if (!name) return null;

      return {
        id: text(brand.id, slugId(name, `brand-${index + 1}`)),
        name,
        ...(brand.logoPath ? { logoPath: brand.logoPath } : {}),
        ...(brand.url ? { url: brand.url } : {}),
      };
    })
    .filter((brand): brand is BrandItem => brand !== null);
}

function normalizeStringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const normalized = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
  return normalized.length > 0 ? normalized : fallback;
}

export function normalizeSiteContent(raw: SiteContentInput): SiteContent {
  const statsBanner = raw.statsBanner ?? {};
  const work = raw.work ?? {};
  const photography = raw.photography ?? {};
  const brands = raw.brands ?? {};
  const whatIsUgc = raw.whatIsUgc ?? {};
  const ugcBenefits = raw.ugcBenefits ?? {};
  const closingCta = raw.closingCta ?? {};
  const testimonials = raw.testimonials ?? DEFAULT_TESTIMONIALS;

  return {
    fullName: raw.fullName,
    name: raw.name,
    brand: raw.brand,
    tagline: raw.tagline,
    hero: {
      subtitle: text(raw.hero?.subtitle, defaultHeroSubtitle(raw.name)),
      ...(raw.hero?.videoPath ? { videoPath: raw.hero.videoPath } : {}),
      ...(raw.hero?.posterPath ? { posterPath: raw.hero.posterPath } : {}),
    },
    statsBanner: {
      visible:
        typeof statsBanner.visible === "boolean"
          ? statsBanner.visible
          : DEFAULT_STATS_BANNER.visible,
      items: normalizeStats(
        statsBanner.items,
        DEFAULT_STATS_BANNER.items,
        "stat",
      ),
    },
    about: {
      headline: raw.about.headline,
      paragraphs: raw.about.paragraphs,
      photos: normalizeAboutPhotos(raw.about.photos),
    },
    work: {
      heading: text(work.heading, DEFAULT_WORK.heading),
    },
    photography: {
      label: text(photography.label, DEFAULT_PHOTOGRAPHY_LABEL),
      photos: normalizeCollagePhotos(
        photography.photos,
        raw.homePhotoGrid?.photos,
      ),
    },
    brands: {
      visible:
        typeof brands.visible === "boolean"
          ? brands.visible
          : DEFAULT_BRANDS.visible,
      heading: text(brands.heading, DEFAULT_BRANDS.heading),
      items: normalizeBrands(brands.items),
    },
    whatIsUgc: {
      heading: text(whatIsUgc.heading, DEFAULT_WHAT_IS_UGC.heading),
      body: text(whatIsUgc.body, DEFAULT_WHAT_IS_UGC.body),
    },
    ugcBenefits: {
      eyebrow: text(ugcBenefits.eyebrow, DEFAULT_UGC_BENEFITS.eyebrow),
      stats: normalizeStats(
        ugcBenefits.stats,
        DEFAULT_UGC_BENEFITS.stats,
        "ugc-stat",
      ),
      calloutLabel: text(
        ugcBenefits.calloutLabel,
        DEFAULT_UGC_BENEFITS.calloutLabel,
      ),
      calloutValue: text(
        ugcBenefits.calloutValue,
        DEFAULT_UGC_BENEFITS.calloutValue,
      ),
      calloutBody: text(
        ugcBenefits.calloutBody,
        DEFAULT_UGC_BENEFITS.calloutBody,
      ),
      benefitsHeading: text(
        ugcBenefits.benefitsHeading,
        DEFAULT_UGC_BENEFITS.benefitsHeading,
      ),
      benefits: normalizeStringList(
        ugcBenefits.benefits,
        DEFAULT_UGC_BENEFITS.benefits,
      ),
    },
    heroLinks: normalizeHeroLinks(raw.heroLinks),
    closingCta: {
      headline: text(closingCta.headline, DEFAULT_CTA_HEADLINE),
      body: text(
        closingCta.body ?? raw.contact?.body,
        defaultCtaBody(raw.name),
      ),
      emailLabel: text(closingCta.emailLabel, DEFAULT_CTA_EMAIL_LABEL),
      ...(closingCta.videoPath ? { videoPath: closingCta.videoPath } : {}),
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
      heading: text(testimonials.heading, DEFAULT_TESTIMONIALS.heading),
      intro: text(testimonials.intro, DEFAULT_TESTIMONIALS.intro),
      items: Array.isArray(testimonials.items)
        ? testimonials.items.map((testimonial, index) => ({
            id: text(testimonial.id, `testimonial-${index + 1}`),
            quote: text(
              testimonial.quote,
              DEFAULT_TESTIMONIALS.items[index]?.quote ?? "",
            ),
            name: text(
              testimonial.name,
              DEFAULT_TESTIMONIALS.items[index]?.name ?? "",
            ),
            role: text(
              testimonial.role,
              DEFAULT_TESTIMONIALS.items[index]?.role ?? "",
            ),
          }))
        : DEFAULT_TESTIMONIALS.items,
    },
  };
}
