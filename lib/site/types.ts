export type HeroLink = {
  label: string;
  href: string;
  emphasis?: "primary";
  activePathPrefix?: string;
};

export type AboutPhoto = {
  id: string;
  caption: string;
  rotate: number;
  imagePath?: string;
};

/** Tile in the photography collage. `shape` drives its span in the masonry. */
export type CollagePhotoShape = "square" | "tall" | "wide";

/** Hard cap for collage tiles in the editor and on save. */
export const MAX_COLLAGE_TILES = 20;

/** Hard cap for brand logos in the editor, on save, and on the public page. */
export const MAX_BRANDS = 30;

export type CollagePhoto = {
  id: string;
  alt: string;
  shape: CollagePhotoShape;
  imagePath?: string;
};

/** Legacy 8-slot home grid, kept only so old saved content can be migrated. */
export type GridPhoto = {
  id: string;
  alt: string;
  imagePath?: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
};

export type HeroIntroServices = [string, string, string];

export type HeroContent = {
  videoPath?: string;
  /** First-frame still shown while the hero video buffers. */
  posterPath?: string;
  /** Cursive line in the forest belt between the intro and the hero video. */
  subtitle: string;
  /** Serif first line of the bottom-left hero title (e.g. "Creative"). */
  titleLine: string;
  /** Display title second line, shown in all caps (e.g. "Portfolio"). */
  titleAccent: string;
  /** Three offerings shown above the intro title, separated by pipes. */
  services: HeroIntroServices;
  /** Creator cutout; falls back to the bundled WebP placeholder. */
  creatorImagePath?: string;
};

/** A single figure in the audience reach section or the UGC proof stats. */
export type StatItem = {
  id: string;
  value: string;
  label: string;
};

export type BrandItem = {
  id: string;
  name: string;
  logoPath?: string;
  url?: string;
};

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
};

export type SiteContent = {
  fullName: string;
  name: string;
  brand: string;
  tagline: string;
  hero: HeroContent;
  statsBanner: {
    visible: boolean;
    items: StatItem[];
  };
  about: {
    headline: string;
    /** Public heading for the gallery under About (e.g. "A little more Emily"). */
    galleryHeading: string;
    paragraphs: string[];
    photos: AboutPhoto[];
  };
  work: {
    heading: string;
  };
  photography: {
    label: string;
    photos: CollagePhoto[];
  };
  brands: {
    visible: boolean;
    heading: string;
    items: BrandItem[];
  };
  whatIsUgc: {
    heading: string;
    body: string;
  };
  ugcBenefits: {
    eyebrow: string;
    stats: StatItem[];
    calloutLabel: string;
    calloutValue: string;
    calloutBody: string;
    benefitsHeading: string;
    benefits: string[];
  };
  heroLinks: HeroLink[];
  closingCta: {
    headline: string;
    body: string;
    emailLabel: string;
    videoPath?: string;
    /** First-frame still shown while the CTA video buffers. */
    posterPath?: string;
  };
  social: {
    instagram: string;
    email: string;
  };
  services: {
    heading: string;
    subtitle: string;
    items: ServiceItem[];
  };
  testimonials: {
    visible: boolean;
    heading: string;
    intro: string;
    items: Testimonial[];
  };
};
