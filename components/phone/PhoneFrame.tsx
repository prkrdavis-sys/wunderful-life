"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const FINISHES = ["natural", "white", "blue", "black"] as const;
type PhoneFinish = (typeof FINISHES)[number];

type PhoneFrameProps = {
  children: ReactNode;
  tilt?: number;
  accentIndex?: number;
  size?: "sm" | "md" | "lg";
  isActive?: boolean;
  className?: string;
};

const widths = {
  sm: 160,
  md: 210,
  lg: 280,
};

function finishForIndex(index: number): PhoneFinish {
  const normalized = ((index % FINISHES.length) + FINISHES.length) % FINISHES.length;
  return FINISHES[normalized];
}

function PhoneScreen({ children }: { children: ReactNode }) {
  return (
    <div className="phone-screen">
      <div className="relative h-full w-full">{children}</div>
      <span className="phone-island" aria-hidden>
        <span className="phone-island-lens" />
      </span>
    </div>
  );
}

function CssPhoneChassis({
  finish,
  children,
}: {
  finish: PhoneFinish;
  children: ReactNode;
}) {
  return (
    <div className="phone-chassis" data-finish={finish}>
      <span className="phone-btn phone-btn-action" aria-hidden />
      <span className="phone-btn phone-btn-vol-up" aria-hidden />
      <span className="phone-btn phone-btn-vol-down" aria-hidden />
      <span className="phone-btn phone-btn-power" aria-hidden />
      <PhoneScreen>{children}</PhoneScreen>
    </div>
  );
}

export function PhoneFrame({
  children,
  tilt = 0,
  accentIndex = 0,
  size = "md",
  isActive = false,
  className = "",
}: PhoneFrameProps) {
  const finish = finishForIndex(accentIndex);
  const width = widths[size];

  return (
    <motion.div
      style={{ rotate: tilt, width }}
      animate={{ scale: isActive ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`phone-device relative shrink-0 ${className}`}
      data-finish={finish}
    >
      <span className="phone-float-shadow" aria-hidden />
      <CssPhoneChassis finish={finish}>{children}</CssPhoneChassis>
    </motion.div>
  );
}
