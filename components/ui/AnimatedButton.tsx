"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { SectionLink } from "@/components/ui/SectionLink";

type AnimatedButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

const variants = {
  primary:
    "bg-green/85 text-white shadow-md shadow-green/15 hover:bg-green-deep border border-green-deep/60",
  secondary:
    "bg-yellow/60 text-brown border border-yellow-deep/40 shadow-sm hover:bg-yellow/80",
  ghost:
    "bg-paper/90 text-brown border border-lavender/35 hover:border-sky-deep/50 hover:bg-white backdrop-blur-sm",
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
