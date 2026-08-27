"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { SectionLink } from "@/components/ui/SectionLink";

type AnimatedButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "soft"
  | "inverse";

type AnimatedButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: AnimatedButtonVariant;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

const variants: Record<AnimatedButtonVariant, string> = {
  primary:
    "border border-forest/50 bg-forest/90 px-6 py-3 font-display text-sm tracking-wide text-paper shadow-md shadow-forest/20 hover:bg-forest",
  secondary:
    "border border-lavender-deep/40 bg-lavender/25 px-6 py-3 font-display text-sm tracking-wide text-ink shadow-sm backdrop-blur-sm hover:border-forest/35 hover:bg-lavender/40",
  ghost:
    "border border-lavender/35 bg-paper/90 px-6 py-3 font-display text-sm tracking-wide text-ink backdrop-blur-sm hover:border-forest/40 hover:bg-white",
  soft:
    "border border-lavender-deep/45 bg-paper/88 px-6 py-3 font-display text-sm tracking-wide text-ink backdrop-blur-sm hover:border-forest/40 hover:bg-paper",
  inverse:
    "whitespace-nowrap border-2 border-forest bg-paper px-5 py-3 font-label text-sm tracking-[0.03em] text-forest shadow-[0_10px_28px_rgba(35,57,42,0.22)] underline decoration-forest/40 underline-offset-[5px] hover:border-forest-deep hover:bg-honey hover:decoration-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:px-8 sm:py-3.5 sm:text-base",
};

export function AnimatedButton({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled,
}: AnimatedButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors ${variants[variant]} ${className}`;

  if (href) {
    return (
      <motion.div
        className="inline-block"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <SectionLink href={href} className={classes} onClick={onClick}>
          {children}
        </SectionLink>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`${classes} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </motion.button>
  );
}
