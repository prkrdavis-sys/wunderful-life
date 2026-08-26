import { Suspense } from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { WorkPreviewSection } from "@/components/sections/WorkPreviewSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { BrandsBanner } from "@/components/sections/BrandsBanner";
import { PhotographyCollage } from "@/components/sections/PhotographyCollage";
import { StatsBannerSection } from "@/components/sections/StatsBannerSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { UgcBenefitsSection } from "@/components/sections/UgcBenefitsSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { MoreEmilySection } from "@/components/sections/MoreEmilySection";
import { ClosingCtaSection } from "@/components/sections/ClosingCtaSection";
import { getVideos } from "@/lib/videos/load";

async function WorkPreview() {
  const videos = await getVideos();
  return <WorkPreviewSection videos={videos} />;
}

function WorkPreviewFallback() {
  return (
    <section
      id="work"
      aria-hidden
      className="scroll-section-anchor relative min-h-[28rem] sm:min-h-[32rem]"
    />
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<WorkPreviewFallback />}>
        <WorkPreview />
      </Suspense>
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
