import dynamic from "next/dynamic";
import { Suspense } from "react";
import { HeroIntro } from "@/components/sections/HeroIntro";
import { WorkPreviewSection } from "@/components/sections/WorkPreviewSection";
import { getVideos } from "@/lib/videos/load";

const HeroVideoSection = dynamic(() =>
  import("@/components/sections/HeroVideoSection").then(
    (module) => module.HeroVideoSection,
  ),
);

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
      <BrandsBanner />
      <div className="photography-about-band relative">
        <PhotographyCollage />
        <StatsBannerSection />
        <AboutSection />
      </div>
      <UgcBenefitsSection />
      <TestimonialsSection />
      <MoreEmilySection />
      <ClosingCtaSection />
    </>
  );
}
