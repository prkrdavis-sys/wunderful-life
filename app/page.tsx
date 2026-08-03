import { AboutSection } from "@/components/sections/AboutSection";
import { ClosingCtaSection } from "@/components/sections/ClosingCtaSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PhotographyCollage } from "@/components/sections/PhotographyCollage";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { StatsBannerSection } from "@/components/sections/StatsBannerSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { UgcBenefitsSection } from "@/components/sections/UgcBenefitsSection";
import { WorkPreviewSection } from "@/components/sections/WorkPreviewSection";
import { listVideos } from "@/lib/storage";

export default async function HomePage() {
  const videos = await listVideos();

  // Colored bands now separate the sections, so no dividers are needed.
  return (
    <>
      <HeroSection />
      <StatsBannerSection />
      <AboutSection />
      <WorkPreviewSection videos={videos} />
      <PhotographyCollage />
      <ServicesSection />
      <UgcBenefitsSection />
      <TestimonialsSection />
      <ClosingCtaSection />
    </>
  );
}
