import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { WhatIsUgcSection } from "@/components/sections/WhatIsUgcSection";
import { WorkPreviewSection } from "@/components/sections/WorkPreviewSection";
import { SectionSeparator } from "@/components/ui/SectionSeparator";
import { listVideos } from "@/lib/storage";

export default async function HomePage() {
  const videos = await listVideos();

  return (
    <>
      <HeroSection />
      <SectionSeparator />
      <AboutSection />
      <SectionSeparator />
      <WhatIsUgcSection />
      <SectionSeparator />
      <WorkPreviewSection videos={videos} />
      <SectionSeparator />
      <ServicesSection />
      <SectionSeparator />
      <TestimonialsSection />
      <SectionSeparator />
      <ContactSection />
    </>
  );
}
