import { HeroIntro } from "@/components/sections/HeroIntro";
import { HeroVideoSection } from "@/components/sections/HeroVideoSection";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-forest-deep">
      <HeroIntro />
      <HeroVideoSection />
    </div>
  );
}
