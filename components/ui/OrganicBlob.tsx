"use client";

import { motion } from "framer-motion";

type AccentColor = "green" | "blue" | "brown" | "yellow" | "pink";

const colors: Record<AccentColor, string> = {
  green: "rgba(154, 132, 196, 0.35)",
  blue: "rgba(91, 141, 239, 0.3)",
  brown: "rgba(107, 83, 68, 0.25)",
  yellow: "rgba(245, 230, 168, 0.45)",
  pink: "rgba(232, 160, 191, 0.35)",
};

export function OrganicBlob({
  color = "pink",
  className = "",
  size = 320,
}: {
  color?: AccentColor;
  className?: string;
  size?: number;
}) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none blob-animate absolute rounded-full blur-3xl ${className}`}
      style={{
        width: size,
        height: size,
        background: colors[color],
      }}
    />
  );
}

export function WaveDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className={`relative h-16 w-full overflow-hidden text-lavender/25 ${flip ? "rotate-180" : ""}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 80"
        fill="currentColor"
        className="absolute bottom-0 w-[200%] min-w-[1440px]"
        preserveAspectRatio="none"
      >
        <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" />
      </svg>
    </div>
  );
}
