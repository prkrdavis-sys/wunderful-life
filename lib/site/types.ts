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

export type HeroContent = {
  videoPath?: string;
  /** First-frame still shown while the hero video buffers. */
  posterPath?: string;
  subtitle: string;
};

/** A single figure in the hero stats banner or the UGC proof stats. */
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
  };
  social: {
    instagram: string;
    email: string;
  };
  services: {
    id: string;
    title: string;
    description: string;
  }[];
  testimonials: {
    visible: boolean;
    heading: string;
    intro: string;
    items: Testimonial[];
  };
};
