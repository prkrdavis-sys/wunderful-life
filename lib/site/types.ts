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
  heroLinks: { label: string; href: string }[];
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
