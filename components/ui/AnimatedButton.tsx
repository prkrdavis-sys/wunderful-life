"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { SectionLink } from "@/components/ui/SectionLink";

type AnimatedButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "soft";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

const variants = {
  primary:
    "border border-forest/50 bg-forest/90 text-paper shadow-md shadow-forest/20 hover:bg-forest",
  secondary:
    "border border-lavender-deep/40 bg-lavender/25 text-ink shadow-sm hover:border-forest/35 hover:bg-lavender/40 backdrop-blur-sm",
  ghost:
    "border border-lavender/35 bg-paper/90 text-ink backdrop-blur-sm hover:border-forest/40 hover:bg-white",
  soft:
    "border border-lavender-deep/45 bg-paper/88 text-ink backdrop-blur-sm hover:border-forest/40 hover:bg-paper",
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
  const classes = `font-display inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-colors ${variants[variant]} ${className}`;

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
