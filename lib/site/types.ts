export type HeroLink = {
  label: string;
  href: string;
  emphasis?: "primary";
  activePathPrefix?: string;
};

export type AboutPhoto = {
  id: string;
  caption: string;
  accent: string;
  rotate: number;
  imagePath?: string;
};

export type SiteContent = {
  fullName: string;
  name: string;
  brand: string;
  tagline: string;
  about: {
    headline: string;
    paragraphs: string[];
    photos: AboutPhoto[];
  };
  heroLinks: HeroLink[];
  social: {
    instagram: string;
    email: string;
  };
  services: {
    id: string;
    title: string;
    description: string;
    accent: string;
  }[];
};
