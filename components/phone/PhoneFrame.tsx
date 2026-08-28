"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";

const FINISHES = ["natural", "white", "blue", "black"] as const;
type PhoneFinish = (typeof FINISHES)[number];

const FRAME_SRC: Record<PhoneFinish, string> = {
  natural: "/mockify/devices/iPhone 15 Pro - Natural Titanium.png",
  white: "/mockify/devices/iPhone 15 Pro - White Titanium.png",
  blue: "/mockify/devices/iPhone 15 Pro - Blue Titanium.png",
  black: "/mockify/devices/iPhone 15 Pro - Black Titanium.png",
};

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

function PhoneScreen({
  children,
  showIsland = false,
}: {
  children: ReactNode;
  showIsland?: boolean;
}) {
  return (
    <div className="phone-screen">
      <div className="relative h-full w-full">{children}</div>
      {showIsland ? (
        <span className="phone-island" aria-hidden>
          <span className="phone-island-lens" />
        </span>
      ) : null}
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
      <PhoneScreen showIsland>{children}</PhoneScreen>
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
  const [frameFailed, setFrameFailed] = useState(false);

  return (
    <motion.div
      style={{ rotate: tilt, width }}
      animate={{ scale: isActive ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`phone-device relative shrink-0 ${className}`}
      data-finish={finish}
    >
      <span className="phone-float-shadow" aria-hidden />
      {frameFailed ? (
        <CssPhoneChassis finish={finish}>{children}</CssPhoneChassis>
      ) : (
        <>
          <PhoneScreen>{children}</PhoneScreen>
          <div className="pointer-events-none absolute inset-0 z-20">
            <Image
              src={FRAME_SRC[finish]}
              alt=""
              fill
              sizes={`${width}px`}
              className="select-none object-contain"
              onError={() => setFrameFailed(true)}
            />
          </div>
        </>
      )}
    </motion.div>
  );
}
