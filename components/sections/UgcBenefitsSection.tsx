import { SectionReveal, StaggerChildren, StaggerItem } from "@/components/ui/motion";

const stats = [
  {
    value: "2.4×",
    label: "more likely to be viewed as authentic",
    tone: "light",
  },
  {
    value: "73%",
    label: "of shoppers say UGC makes a brand feel more trustworthy",
    tone: "paper",
  },
  {
    value: "79%",
    label: "of people say UGC strongly influences what they buy",
    tone: "dark",
  },
] as const;

const benefits = [
  "Builds trust with real stories",
  "Creates natural engagement",
  "Boosts conversions across channels",
  "Makes your brand feel human",
];

export function UgcBenefitsSection() {
  return (
    <section
      id="ugc-benefits"
      aria-labelledby="ugc-benefits-heading"
      className="ugc-benefits-section scroll-section-anchor relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="ugc-leaf-mark ugc-leaf-mark-left" aria-hidden />
      <div className="ugc-leaf-mark ugc-leaf-mark-right" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="font-label text-xs font-semibold tracking-[0.22em] text-paper/75 uppercase">
            The power of real stories
          </p>
          <h2
            id="ugc-benefits-heading"
            className="mt-3 font-serif text-4xl tracking-tight text-paper sm:text-6xl"
          >
            Why UGC?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-paper/82 sm:text-base">
            People connect with people. User-generated content brings your
            product into an honest, relatable moment — and gives your audience
            a reason to believe.
          </p>
        </SectionReveal>

        <StaggerChildren className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3 sm:gap-6">
          {stats.map((stat) => (
            <StaggerItem key={stat.value}>
              <article className={`ugc-stat-card ugc-stat-card-${stat.tone}`}>
                <p className="font-serif text-4xl leading-none sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-4 max-w-[12rem] text-center text-xs leading-relaxed sm:text-sm">
                  {stat.label}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <SectionReveal className="text-center lg:text-left">
            <p className="font-label text-xs font-semibold tracking-[0.2em] text-paper/75 uppercase">
              Did you know?
            </p>
            <p className="mt-3 font-serif text-7xl leading-none text-paper sm:text-8xl">
              93%
            </p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-paper/82 lg:mx-0 sm:text-base">
              of marketers say authentic content performs better than
              traditional brand-made content.
            </p>
          </SectionReveal>

          <SectionReveal
            delay={0.12}
            className="ugc-benefits-card rounded-[2rem] border border-paper/35 p-6 text-indigo shadow-xl shadow-indigo/10 sm:p-8"
          >
            <p className="font-label text-xs font-semibold tracking-[0.2em] text-burgundy/80 uppercase">
              UGC benefits
            </p>
            <h3 className="mt-2 font-display text-2xl text-burgundy sm:text-3xl">
              Content that feels like a recommendation.
            </h3>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-burgundy text-xs text-paper"
                  >
                    ✓
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
