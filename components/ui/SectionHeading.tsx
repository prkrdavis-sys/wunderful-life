import type { ReactNode } from "react";
import { SectionReveal } from "@/components/ui/motion";

type SectionHeadingProps = {
  children: ReactNode;
  id?: string;
  className?: string;
};

/** Script section title with a short honey rule underneath. */
export function SectionHeading({
  children,
  id,
  className = "",
}: SectionHeadingProps) {
  return (
    <SectionReveal className={`mx-auto max-w-4xl text-center ${className}`}>
      <h2
        id={id}
        className="font-script text-4xl leading-tight text-balance text-forest sm:text-6xl"
      >
        {children}
      </h2>
      <span
        aria-hidden
        className="mx-auto mt-5 block h-px w-14 bg-honey-deep/70"
      />
    </SectionReveal>
  );
}
