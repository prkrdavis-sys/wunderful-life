import { AboutSection } from "@/components/sections/AboutSection";
import { BrandsBanner } from "@/components/sections/BrandsBanner";
import { ClosingCtaSection } from "@/components/sections/ClosingCtaSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { MoreEmilySection } from "@/components/sections/MoreEmilySection";
import { PhotographyCollage } from "@/components/sections/PhotographyCollage";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { StatsBannerSection } from "@/components/sections/StatsBannerSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { UgcBenefitsSection } from "@/components/sections/UgcBenefitsSection";
import { WorkPreviewSection } from "@/components/sections/WorkPreviewSection";
import { getVideos } from "@/lib/videos/load";

export default async function HomePage() {
  const videos = await getVideos();

  // Colored bands now separate the sections, so no dividers are needed.
  return (
    <>
      <HeroSection />
      <StatsBannerSection />
      <AboutSection />
      <ServicesSection />
      <WorkPreviewSection videos={videos} />
      <UgcBenefitsSection />
      <BrandsBanner />
      <PhotographyCollage />
      <TestimonialsSection />
      <MoreEmilySection />
      <ClosingCtaSection />
    </>
  );
}
