"use client";

import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

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

/**
 * First paint stays visible. Below-fold nodes may snap to hidden after
 * hydration (off-screen), then animate in when they intersect — never as a
 * requirement to read copy.
 */
function useDeferredInViewAnimation(enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setShown(true);
      return;
    }
    const node = ref.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
    if (onScreen) return;

    setShown(false);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px", threshold: 0 },
    );
    observer.observe(node);
    const fallback = window.setTimeout(() => setShown(true), 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [enabled]);

  return { ref, shown };
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
  const states = revealStates[variant];
  const { ref, shown } = useDeferredInViewAnimation(reduceMotion === false);
  const revealTransition = useRevealTransition(delay, duration);

  return (
    <motion.div
      ref={ref}
      initial={states.visible}
      animate={shown ? states.visible : states.hidden}
      transition={shown ? revealTransition : { duration: 0 }}
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
  const { ref, shown } = useDeferredInViewAnimation(reduceMotion === false);

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={shown ? "visible" : "hidden"}
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
