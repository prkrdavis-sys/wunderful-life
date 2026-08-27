"use client";

import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { type ComponentProps, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;
const REVEAL_DURATION = 0.78;
const STAGGER_ITEM_DURATION = 0.72;
const VIEWPORT = { once: true, amount: 0.22 } as const;

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
    hidden: { opacity: 0, y: 36 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -24 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -36 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 36 },
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

function useRevealTransition(delay = 0, duration = REVEAL_DURATION): Transition {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return { duration: 0 };
  }

  return { duration, delay, ease: EASE };
}

export function HeroEntrance({
  children,
  className = "",
  delay = 0,
  variant = "fadeUp",
  duration = 0.85,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  duration?: number;
  as?: "div" | "span";
}) {
  const reduceMotion = useReducedMotion();
  const states = revealStates[variant];
  const revealTransition = useRevealTransition(delay, duration);
  const MotionTag = as === "span" ? motion.span : motion.div;

  return (
    <MotionTag
      initial={reduceMotion ? states.visible : states.hidden}
      animate={states.visible}
      transition={revealTransition}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export function SectionReveal({
  children,
  className = "",
  delay = 0,
  variant = "fadeUp",
  duration = REVEAL_DURATION,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  const states = revealStates[variant];
  const revealTransition = useRevealTransition(delay, duration);
  const visible = states.visible;

  return (
    <motion.div
      initial={reduceMotion ? visible : states.hidden}
      whileInView={visible}
      viewport={VIEWPORT}
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
  delayChildren = 0.06,
}: ComponentProps<"div"> & { stagger?: number; delayChildren?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : stagger,
            delayChildren: reduceMotion ? 0 : delayChildren,
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
          transition: { duration: STAGGER_ITEM_DURATION, ease: EASE },
        },
      };

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
