"use client";

import { DeviceMockup, iPhone15Pro } from "@mockifydev/react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const PHONE_COLORS = [
  "Natural Titanium",
  "White Titanium",
  "Blue Titanium",
  "Black Titanium",
  "Natural Titanium",
] as const;

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

export function PhoneFrame({
  children,
  tilt = 0,
  accentIndex = 0,
  size = "md",
  isActive = false,
  className = "",
}: PhoneFrameProps) {
  const color = PHONE_COLORS[accentIndex % PHONE_COLORS.length];

  return (
    <motion.div
      style={{ rotate: tilt }}
      animate={{ scale: isActive ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`shrink-0 ${className}`}
    >
      <DeviceMockup
        device={iPhone15Pro}
        color={color}
        width={widths[size]}
        basePath="/mockify"
        showStatusBar={false}
        screenColor="#0a0a0a"
        className={
          isActive
            ? "drop-shadow-xl drop-shadow-brown/20"
            : "drop-shadow-lg drop-shadow-brown/15"
        }
      >
        <div className="relative h-full w-full">{children}</div>
      </DeviceMockup>
    </motion.div>
  );
}
