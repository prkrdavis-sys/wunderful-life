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

export type GridPhoto = {
  id: string;
  alt: string;
  imagePath?: string;
};

export type WhatIsUgcHighlight = {
  id: string;
  title: string;
  description: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
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
  homePhotoGrid: {
    photos: GridPhoto[];
  };
  whatIsUgc: {
    heading: string;
    body: string;
    highlights: WhatIsUgcHighlight[];
  };
  heroLinks: HeroLink[];
  contact: {
    headline: string;
    body: string;
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
