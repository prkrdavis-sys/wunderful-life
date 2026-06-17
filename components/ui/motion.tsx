"use client";

import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

export type RevealVariant =
  | "fadeUp"
  | "fadeDown"
  | "fadeLeft"
  | "fadeRight"
  | "scale"
  | "blur";

const revealStates: Record<
  RevealVariant,
  { hidden: Record<string, number | string>; visible: Record<string, number | string> }
> = {
  fadeUp: {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -28 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -48 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 48 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
};

function useRevealTransition(delay = 0, duration = 0.6): Transition {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return { duration: 0 };
  }

  return { duration, delay, ease: EASE };
}

function getRevealProps(
  variant: RevealVariant,
  reduceMotion: boolean | null,
) {
  const states = revealStates[variant];
  const visible = states.visible;

  return {
    initial: reduceMotion ? visible : states.hidden,
    animate: visible,
  };
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`font-label rounded-full border-2 px-4 py-1.5 text-sm font-medium tracking-wide transition-colors ${
        active
          ? "border-green bg-green text-white"
          : "border-brown/20 bg-white/80 text-brown hover:border-pink"
      }`}
    >
      {children}
    </motion.button>
  );
}

export function HeroEntrance({
  children,
  className = "",
  delay = 0,
  variant = "fadeUp",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
}) {
  const reduceMotion = useReducedMotion();
  const { initial, animate } = getRevealProps(variant, reduceMotion);

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={useRevealTransition(delay)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionReveal({
  children,
  className = "",
  delay = 0,
  variant = "fadeUp",
  duration = 0.6,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  const { initial, animate } = getRevealProps(variant, reduceMotion);

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: "-80px" }}
      transition={useRevealTransition(delay, duration)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerChildren({
  children,
  className = "",
  stagger = 0.12,
}: ComponentProps<"div"> & { stagger?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
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
  const reduceMotion = useReducedMotion();
  const states = revealStates[variant];

  const variants: Variants = reduceMotion
    ? {
        hidden: states.visible,
        visible: states.visible,
      }
    : {
        hidden: states.hidden,
        visible: {
          ...states.visible,
          transition: { duration: 0.5, ease: EASE },
        },
      };

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
