import type { CSSProperties } from "react";

export type FlowerKind =
  | "rose"
  | "peony"
  | "chrysanthemum"
  | "sunflower"
  | "hibiscus"
  | "dahlia";
export type MotifKind = "flower" | "moon" | "star";

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
  flower?: FlowerKind;
  /** Positioning + sizing utilities for the wrapper. */
  position: string;
  rotate?: number;
  delay?: number;
  duration?: number;
};

const FLOWER_ASSETS: Record<FlowerKind, string> = {
  rose: "/flowers/rose.png",
  peony: "/flowers/peony.png",
  chrysanthemum: "/flowers/chrysanthemum.png",
  sunflower: "/flowers/sunflower.png",
  hibiscus: "/flowers/hibiscus.png",
  dahlia: "/flowers/dahlia.png",
};

function Flower({ variant = "rose" }: { variant?: FlowerKind }) {
  const style = {
    "--flower-image": `url("${FLOWER_ASSETS[variant]}")`,
  } as CSSProperties;

  return <span aria-hidden className="flower-silhouette" style={style} />;
}

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

type MotifShapeProps = {
  variant?: FlowerKind;
};

const MOTIF_SHAPES: Record<
  MotifKind,
  (props: MotifShapeProps) => React.JSX.Element
> = {
  flower: ({ variant }) => <Flower variant={variant} />,
  moon: Moon,
  star: Star,
};

const PRESETS: Record<Exclude<MotifPreset, "none">, MotifSpec[]> = {
  edges: [
    {
      kind: "flower",
      flower: "rose",
      position: "left-[2%] top-[14%] h-16 w-16 sm:h-20 sm:w-20",
      rotate: -14,
    },
    { kind: "star", position: "left-[8%] bottom-[18%] h-7 w-7 sm:h-9 sm:w-9", delay: 3, duration: 22 },
    { kind: "moon", position: "right-[3%] top-[22%] h-14 w-14 sm:h-16 sm:w-16", rotate: 18, delay: 1.5 },
    {
      kind: "flower",
      flower: "chrysanthemum",
      position: "right-[7%] bottom-[12%] h-12 w-12 sm:h-16 sm:w-16",
      rotate: 22,
      delay: 4,
      duration: 20,
    },
  ],
  left: [
    {
      kind: "flower",
      flower: "peony",
      position: "left-[3%] top-[18%] h-16 w-16 sm:h-24 sm:w-24",
      rotate: -18,
    },
    { kind: "star", position: "left-[12%] bottom-[16%] h-8 w-8 sm:h-10 sm:w-10", delay: 2.5, duration: 21 },
    { kind: "moon", position: "left-[6%] bottom-[42%] h-10 w-10 sm:h-12 sm:w-12", rotate: -8, delay: 5 },
  ],
  right: [
    { kind: "moon", position: "right-[4%] top-[16%] h-14 w-14 sm:h-20 sm:w-20", rotate: 16 },
    {
      kind: "flower",
      flower: "sunflower",
      position: "right-[10%] bottom-[20%] h-14 w-14 sm:h-20 sm:w-20",
      rotate: 24,
      delay: 3,
      duration: 20,
    },
    { kind: "star", position: "right-[3%] bottom-[46%] h-7 w-7 sm:h-9 sm:w-9", delay: 1, duration: 24 },
  ],
  scatter: [
    { kind: "star", position: "left-[6%] top-[12%] h-6 w-6 sm:h-8 sm:w-8", duration: 20 },
    {
      kind: "flower",
      flower: "hibiscus",
      position: "left-[16%] bottom-[10%] h-12 w-12 sm:h-16 sm:w-16",
      rotate: -20,
      delay: 2,
    },
    { kind: "moon", position: "right-[8%] top-[26%] h-12 w-12 sm:h-14 sm:w-14", rotate: 12, delay: 4 },
    { kind: "star", position: "right-[18%] bottom-[14%] h-8 w-8 sm:h-10 sm:w-10", delay: 6, duration: 23 },
    {
      kind: "flower",
      flower: "dahlia",
      position: "left-[46%] top-[4%] h-10 w-10 sm:h-12 sm:w-12",
      rotate: 8,
      delay: 5,
      duration: 26,
    },
  ],
  corners: [
    { kind: "star", position: "left-[4%] top-[10%] h-8 w-8 sm:h-11 sm:w-11", duration: 21 },
    { kind: "moon", position: "right-[5%] bottom-[12%] h-12 w-12 sm:h-16 sm:w-16", rotate: 20, delay: 3 },
  ],
};

type DecorMotifsProps = {
  preset?: MotifPreset;
  /** `ink` reads on light washes, `paper` on the forest bands. */
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
            <Shape variant={motif.flower} />
          </span>
        );
      })}
    </div>
  );
}
