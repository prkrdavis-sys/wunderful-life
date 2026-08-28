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
      <div className="photography-about-band relative">
        <AboutSection />
        <StatsBannerSection />
      </div>
      <Suspense fallback={<WorkPreviewFallback />}>
        <WorkPreview />
      </Suspense>
      <ServicesSection />
      <PhotographyCollage />
      <BrandsBanner />
      <TestimonialsSection />
      <MoreEmilySection />
      <UgcBenefitsSection />
      <ClosingCtaSection />
    </>
  );
}
