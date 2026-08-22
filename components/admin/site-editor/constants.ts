import type { SiteEditorSection } from "@/components/admin/AdminViewProvider";

export const ABOUT_INTRO_PHOTO_COUNT = 2;

export const SECTIONS: { id: SiteEditorSection; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "hero", label: "Hero" },
  { id: "stats", label: "Stats banner" },
  { id: "services", label: "Services" },
  { id: "brands", label: "Brands" },
  { id: "work", label: "Videos" },
  { id: "ugc", label: "Why UGC" },
  { id: "photography", label: "Photography" },
  { id: "about", label: "About" },
  { id: "testimonials", label: "Testimonials" },
  { id: "photos", label: "A little more" },
  { id: "cta", label: "Closing CTA" },
];

export const inputClass =
  "mt-1 w-full min-w-0 rounded-xl border border-brown/20 bg-white px-3 py-2.5 leading-normal text-base text-brown";

export const cardClass = "space-y-3 rounded-2xl border border-brown/15 bg-cream/50 p-4";

export const smallButtonClass =
  "rounded-lg border border-brown/25 bg-white px-2 py-1 text-xs font-medium text-brown transition hover:border-forest/45 hover:text-forest disabled:cursor-not-allowed disabled:opacity-40";
