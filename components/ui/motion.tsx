"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";

export type RevealVariant =
  | "fade"
  | "fadeUp"
  | "fadeDown"
  | "fadeLeft"
  | "fadeRight"
  | "slideFromLeft"
  | "scale"
  | "blur";

type RevealPhase = "pending" | "ready" | "shown";

const VARIANT_CLASS: Record<RevealVariant, string> = {
  fade: "reveal-fade",
  fadeUp: "reveal-up",
  fadeDown: "reveal-down",
  fadeLeft: "reveal-left",
  fadeRight: "reveal-right",
  slideFromLeft: "reveal-from-left",
  scale: "reveal-scale",
  blur: "reveal-blur",
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isAlreadyOnScreen(node: Element) {
  const rect = node.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  return rect.top < viewportHeight * 0.9 && rect.bottom > viewportHeight * 0.05;
}

function useRevealPhase() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<RevealPhase>("pending");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion() || isAlreadyOnScreen(node)) {
      setPhase("shown");
      return;
    }

    setPhase("ready");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setPhase("shown");
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, phase };
}

function revealVars(delay = 0, duration?: number): CSSProperties {
  return {
    ["--reveal-delay" as string]: `${delay}s`,
    ["--reveal-duration" as string]: duration ? `${duration}s` : undefined,
  };
}

export function HeroEntrance({
  children,
  className = "",
  delay = 0,
  variant = "fadeUp",
  duration = 0.9,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  duration?: number;
  as?: "div" | "span";
}) {
  const Tag = as === "span" ? "span" : "div";

  return (
    <Tag
      className={`hero-enter ${VARIANT_CLASS[variant]} ${className}`}
      style={{
        ["--enter-delay" as string]: `${delay}s`,
        ["--enter-duration" as string]: `${duration}s`,
      }}
    >
      {children}
    </Tag>
  );
}

export function SectionReveal({
  children,
  className = "",
  delay = 0,
  variant = "fadeUp",
  duration = 0.8,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  duration?: number;
}) {
  const { ref, phase } = useRevealPhase();

  return (
    <div
      ref={ref}
      data-reveal={phase}
      className={`reveal ${VARIANT_CLASS[variant]} ${className}`}
      style={revealVars(delay, duration)}
    >
      {children}
    </div>
  );
}

export function StaggerChildren({
  children,
  className = "",
  stagger = 0.1,
  delayChildren = 0.04,
  ...props
}: ComponentProps<"div"> & { stagger?: number; delayChildren?: number }) {
  const { ref, phase } = useRevealPhase();

  return (
    <div
      {...props}
      ref={ref}
      data-reveal={phase}
      className={`reveal-stagger ${className}`}
      style={{
        ["--stagger" as string]: `${stagger}s`,
        ["--stagger-start" as string]: `${delayChildren}s`,
      }}
    >
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className = "",
  variant = "fadeUp",
}: {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
}) {
  return (
    <div className={`reveal-item ${VARIANT_CLASS[variant]} ${className}`}>
      {children}
    </div>
  );
}
