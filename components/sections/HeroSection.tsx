import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { getSiteContent } from "@/lib/site";

export function HeroSection() {
  const site = getSiteContent();

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
      <div className="grain-overlay pointer-events-none absolute inset-0 opacity-30" aria-hidden />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className="mb-3 text-sm font-medium tracking-[0.28em] text-indigo/80 uppercase">
          {site.brand}
        </p>
        <h1 className="font-display text-5xl leading-[1.05] text-brown sm:text-6xl md:text-7xl lg:text-8xl">
          {site.fullName}
        </h1>
        <p className="mt-4 font-display text-xl text-burgundy/90 sm:text-2xl">
          UGC Creator · Creative · Nature-driven
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          {site.tagline}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {site.heroLinks.map((link) => (
            <AnimatedButton
              key={link.href}
              href={link.href}
              variant={link.href === "/#work" ? "primary" : "ghost"}
            >
              {link.label}
            </AnimatedButton>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-muted/90">
          I&apos;m {site.name} — the face behind the frame. Brands hire me for
          deliverables; they remember me for the personality.
        </p>
      </div>
    </section>
  );
}
