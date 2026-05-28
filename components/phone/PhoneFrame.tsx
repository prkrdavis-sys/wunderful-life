"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const accentBorders = [
  "border-brown/30",
  "border-green/35",
  "border-pink/30",
  "border-blue/25",
  "border-brown/25",
];

type PhoneFrameProps = {
  children: ReactNode;
  tilt?: number;
  accentIndex?: number;
  size?: "sm" | "md" | "lg";
  isActive?: boolean;
  className?: string;
};

const sizes = {
  sm: "w-[140px] sm:w-[160px]",
  md: "w-[180px] sm:w-[210px]",
  lg: "w-[220px] sm:w-[260px] md:w-[300px]",
};

export function PhoneFrame({
  children,
  tilt = 0,
  accentIndex = 0,
  size = "md",
  isActive = false,
  className = "",
}: PhoneFrameProps) {
  const borderClass = accentBorders[accentIndex % accentBorders.length];

  return (
    <motion.div
      style={{ rotate: tilt }}
      animate={{ scale: isActive ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`${sizes[size]} shrink-0 ${className}`}
    >
      <div
        className={`rounded-[2rem] border bg-white/90 p-1.5 shadow-md shadow-brown/10 transition-shadow ${borderClass} ${
          isActive ? "shadow-lg shadow-green/15" : ""
        }`}
      >
        <div className="relative aspect-[9/19] overflow-hidden rounded-[1.5rem] bg-foreground/95">
          <div className="absolute top-2 left-1/2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-brown/25" />
          {children}
        </div>
      </div>
    </motion.div>
  );
}
