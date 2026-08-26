import type { CSSProperties } from "react";

export type MotifKind = "moon" | "star";

/** Named arrangements so sections can vary without repeating coordinates. */
export type MotifPreset =
  | "none"
  | "edges"
  | "left"
  | "right"
  | "scatter"
  | "corners";

type MotifSpec = {
  kind: MotifKind;
  /** Positioning + sizing utilities for the wrapper. */
  position: string;
  rotate?: number;
  delay?: number;
  duration?: number;
};

function Moon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-full w-full">
      <path
        d="M38 8a24 24 0 1 0 0 48 19 19 0 1 1 0-48Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-full w-full">
      <path
        d="M32 4c2 16 12 26 28 28-16 2-26 12-28 28-2-16-12-26-28-28 16-2 26-12 28-28Z"
        fill="currentColor"
      />
    </svg>
  );
}

const MOTIF_SHAPES: Record<MotifKind, () => React.JSX.Element> = {
  moon: Moon,
  star: Star,
};

const PRESETS: Record<Exclude<MotifPreset, "none">, MotifSpec[]> = {
  edges: [
    { kind: "star", position: "left-[8%] bottom-[18%] h-7 w-7 sm:h-9 sm:w-9", delay: 3, duration: 22 },
    { kind: "moon", position: "right-[3%] top-[22%] h-14 w-14 sm:h-16 sm:w-16", rotate: 18, delay: 1.5 },
  ],
  left: [
    { kind: "star", position: "left-[12%] bottom-[16%] h-8 w-8 sm:h-10 sm:w-10", delay: 2.5, duration: 21 },
    { kind: "moon", position: "left-[6%] bottom-[42%] h-10 w-10 sm:h-12 sm:w-12", rotate: -8, delay: 5 },
  ],
  right: [
    { kind: "moon", position: "right-[4%] top-[16%] h-14 w-14 sm:h-20 sm:w-20", rotate: 16 },
    { kind: "star", position: "right-[3%] bottom-[46%] h-7 w-7 sm:h-9 sm:w-9", delay: 1, duration: 24 },
  ],
  scatter: [
    { kind: "star", position: "left-[6%] top-[12%] h-6 w-6 sm:h-8 sm:w-8", duration: 20 },
    { kind: "moon", position: "right-[8%] top-[26%] h-12 w-12 sm:h-14 sm:w-14", rotate: 12, delay: 4 },
    { kind: "star", position: "right-[18%] bottom-[14%] h-8 w-8 sm:h-10 sm:w-10", delay: 6, duration: 23 },
  ],
  corners: [
    { kind: "star", position: "left-[4%] top-[10%] h-8 w-8 sm:h-11 sm:w-11", duration: 21 },
    { kind: "moon", position: "right-[5%] bottom-[12%] h-12 w-12 sm:h-16 sm:w-16", rotate: 20, delay: 3 },
  ],
};

type DecorMotifsProps = {
  preset?: MotifPreset;
  /** `ink` reads on light washes, `paper` on dark forest washes. */
  tone?: "ink" | "paper";
  className?: string;
};

const TONE_CLASS = {
  ink: "text-forest opacity-[0.1]",
  paper: "text-paper opacity-[0.12]",
} as const;

export function DecorMotifs({
  preset = "edges",
  tone = "ink",
  className = "",
}: DecorMotifsProps) {
  if (preset === "none") return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${TONE_CLASS[tone]} ${className}`}
    >
      {PRESETS[preset].map((motif, index) => {
        const Shape = MOTIF_SHAPES[motif.kind];
        const style = {
          "--motif-rotate": `${motif.rotate ?? 0}deg`,
          "--motif-delay": `${motif.delay ?? 0}s`,
          "--motif-duration": `${motif.duration ?? 18}s`,
        } as CSSProperties;

        return (
          <span
            key={`${motif.kind}-${index}`}
            className={`motif-float absolute ${motif.position}`}
            style={style}
          >
            <Shape />
          </span>
        );
      })}
    </div>
  );
}
