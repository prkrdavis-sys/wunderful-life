import { Suspense } from "react";
import { AboutSection } from "@/components/sections/AboutSection";
import { BrandsBanner } from "@/components/sections/BrandsBanner";
import { ClosingCtaSection } from "@/components/sections/ClosingCtaSection";
import { HeroIntro } from "@/components/sections/HeroIntro";
import { HeroVideoSection } from "@/components/sections/HeroVideoSection";
import { MoreEmilySection } from "@/components/sections/MoreEmilySection";
import { PhotographyCollage } from "@/components/sections/PhotographyCollage";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { StatsBannerSection } from "@/components/sections/StatsBannerSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { UgcBenefitsSection } from "@/components/sections/UgcBenefitsSection";
import { WorkPreviewSection } from "@/components/sections/WorkPreviewSection";
import { SectionSurface } from "@/components/ui/SectionSurface";
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
      <div className="relative overflow-hidden">
        <HeroIntro />
        <HeroVideoSection />
      </div>
      <Suspense fallback={<WorkPreviewFallback />}>
        <WorkPreview />
      </Suspense>
      <ServicesSection />
      <div className="photography-about-band relative">
        <PhotographyCollage />
        <AboutSection />
        <StatsBannerSection />
      </div>
      <div className="relative overflow-hidden">
        <SectionSurface tone="lavender" motifs="scatter" />
        <BrandsBanner />
        <TestimonialsSection />
      </div>
      <MoreEmilySection />
      <UgcBenefitsSection />
      <ClosingCtaSection />
    </>
  );
}
