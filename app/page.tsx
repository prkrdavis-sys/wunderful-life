import dynamic from "next/dynamic";
import { HeroSection } from "@/components/sections/HeroSection";
import { WorkPreviewSection } from "@/components/sections/WorkPreviewSection";
import { getVideos } from "@/lib/videos/load";

const ServicesSection = dynamic(() =>
  import("@/components/sections/ServicesSection").then(
    (module) => module.ServicesSection,
  ),
);
const BrandsBanner = dynamic(() =>
  import("@/components/sections/BrandsBanner").then(
    (module) => module.BrandsBanner,
  ),
);
const PhotographyCollage = dynamic(() =>
  import("@/components/sections/PhotographyCollage").then(
    (module) => module.PhotographyCollage,
  ),
);
const StatsBannerSection = dynamic(() =>
  import("@/components/sections/StatsBannerSection").then(
    (module) => module.StatsBannerSection,
  ),
);
const AboutSection = dynamic(() =>
  import("@/components/sections/AboutSection").then(
    (module) => module.AboutSection,
  ),
);
const UgcBenefitsSection = dynamic(() =>
  import("@/components/sections/UgcBenefitsSection").then(
    (module) => module.UgcBenefitsSection,
  ),
);
const TestimonialsSection = dynamic(() =>
  import("@/components/sections/TestimonialsSection").then(
    (module) => module.TestimonialsSection,
  ),
);
const MoreEmilySection = dynamic(() =>
  import("@/components/sections/MoreEmilySection").then(
    (module) => module.MoreEmilySection,
  ),
);
const ClosingCtaSection = dynamic(() =>
  import("@/components/sections/ClosingCtaSection").then(
    (module) => module.ClosingCtaSection,
  ),
);

export default async function HomePage() {
  const videos = await getVideos();

  return (
    <>
      <HeroSection />
      <WorkPreviewSection videos={videos} />
      <ServicesSection />
      <BrandsBanner />
      <PhotographyCollage />
      <StatsBannerSection />
      <AboutSection />
      <UgcBenefitsSection />
      <TestimonialsSection />
      <MoreEmilySection />
      <ClosingCtaSection />
    </>
  );
}
