"use client";

import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { type ComponentProps, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

export type RevealVariant =
  | "fade"
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
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeUp: {
    hidden: { opacity: 0, y: 48 },
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

function useRevealTransition(delay = 0, duration = 0.72): Transition {
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
    initial: reduceMotion ? visible : { ...states.hidden, opacity: 1 },
    animate: visible,
  };
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
  const states = revealStates[variant];
  const revealTransition = useRevealTransition(delay, duration);

  return (
    <motion.div
      initial={states.visible}
      animate={states.visible}
      transition={revealTransition}
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
      initial={false}
      animate="visible"
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
        hidden: { ...states.hidden, opacity: 1 },
        visible: {
          ...states.visible,
          transition: { duration: 0.62, ease: EASE },
        },
      };

  return (
    <motion.div initial={false} variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
