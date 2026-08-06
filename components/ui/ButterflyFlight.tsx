"use client";

import {
  animate,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import { butterflyFlights, type ButterflyFlightId } from "@/lib/butterflies";

/**
 * Flight paths are authored in this coordinate space. The rendered box keeps the
 * same aspect ratio so the SVG scales uniformly and never distorts the dashes.
 */
const AREA = { width: 400, height: 300 };

/** Sprite cell dimensions of public/butterfly/flap-strip.png. */
const SPRITE = { width: 152, height: 163 };

/**
 * Where the butterfly's body sits within its sprite cell, as a fraction of the
 * cell. The path is followed by the body rather than the frame's centre, so the
 * trail emerges from the creature and the wing sweeps around it.
 */
const BODY_ANCHOR = { x: 0.74, y: 0.62 };

/** Fraction of the path sampled either side of the butterfly to read its heading. */
const HEADING_STEP = 0.004;
/** A butterfly drifts rather than nose-dives, so the pitch is damped and capped. */
const TILT_DAMPING = 0.7;
const MAX_TILT_DEGREES = 26;

/**
 * The trail fades out behind the butterfly rather than persisting, so it never
 * accumulates into a drawing of the whole route. A stroke cannot fade along its own
 * length, so the reveal mask is built from this many stacked slices, each a short
 * piece of the path at a progressively lower opacity.
 */
const TRAIL_SLICES = 14;
/**
 * Slices are stretched backwards past their own start so neighbours overlap, which
 * hides the antialiased seams between them. They are drawn tail first, so the
 * brighter slice always paints over the dimmer one it overlaps. The stretch must go
 * backwards: extending forwards would push the leading slice past the butterfly and
 * draw trail ahead of it.
 */
const SLICE_OVERLAP = 1.3;

/**
 * Drops a preset butterfly into a section, layered between the section's
 * background wash and its `z-10` content.
 */
export function SectionButterfly({ flight }: { flight: ButterflyFlightId }) {
  const preset = butterflyFlights[flight];

  return <ButterflyFlight {...preset} className={`z-[5] ${preset.className}`} />;
}

type ButterflyFlightProps = {
  /** SVG path data authored in a 400 x 300 space. Must end where it starts. */
  path: string;
  /** Tailwind positioning classes, e.g. "top-24 right-8". */
  className?: string;
  /** Seconds for one full circuit of the path. */
  duration?: number;
  /** Rendered width of the flight area in pixels, capped at `maxViewportWidth`. */
  areaWidth?: number;
  maxViewportWidth?: number;
  /** Butterfly width in path units. */
  size?: number;
  /** Length of the visible trail, in path units. */
  trailLength?: number;
  /** Seconds per wing beat. */
  flapDuration?: number;
  /** Tailwind text colour class; the sprite and trail both inherit currentColor. */
  colorClassName?: string;
  opacity?: number;
  /** Trail opacity relative to the layer, so the line reads lighter than the wing. */
  trailOpacity?: number;
};

export function ButterflyFlight({
  path,
  className = "",
  duration = 30,
  areaWidth = 360,
  maxViewportWidth = 72,
  size = 34,
  trailLength = 190,
  flapDuration = 0.72,
  colorClassName = "text-forest-deep",
  opacity = 0.75,
  trailOpacity = 0.6,
}: ButterflyFlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const sliceRefs = useRef<(SVGPathElement | null)[]>([]);
  const butterflyRef = useRef<HTMLDivElement>(null);

  const reduceMotion = useReducedMotion();
  const inView = useInView(containerRef, { amount: 0.15 });
  const isFlying = inView && !reduceMotion;

  const progress = useMotionValue(0);
  const maskId = `butterfly-trail-${useId()}`;

  // The sprite is sized as a fraction of the box so it scales with the container.
  const spriteUnits = { width: size, height: (size * SPRITE.height) / SPRITE.width };

  /**
   * Positions the sprite entirely in percentages of its own box, which keeps the
   * transform resolution-independent: no pixel conversion, and therefore nothing to
   * recompute when the container is resized. Read right to left, the sprite is
   * shifted so its body sits on the origin, mirrored, pitched, then carried out to
   * its place on the path.
   */
  const transformFor = useCallback(
    (x: number, y: number, tilt: number, facing: number) =>
      [
        `translate(${(x / spriteUnits.width) * 100}%, ${(y / spriteUnits.height) * 100}%)`,
        `rotate(${tilt}deg)`,
        `scaleX(${facing})`,
        `translate(${-BODY_ANCHOR.x * 100}%, ${-BODY_ANCHOR.y * 100}%)`,
      ].join(" "),
    [spriteUnits.width, spriteUnits.height],
  );

  // Placing the butterfly means reading the path geometry, which only exists once
  // the SVG is in the DOM, so this is applied imperatively rather than through
  // motion's style bindings.
  const applyProgress = useCallback(
    (value: number) => {
      const trail = trailRef.current;
      const butterfly = butterflyRef.current;
      if (!trail || !butterfly) return;

      const total = trail.getTotalLength();
      if (total === 0) return;

      const pointAt = (fraction: number) =>
        trail.getPointAtLength(Math.min(Math.max(fraction, 0), 1) * total);

      const here = pointAt(value);
      const ahead = pointAt(value + HEADING_STEP);
      const behind = pointAt(value - HEADING_STEP);
      const dx = ahead.x - behind.x;
      const dy = ahead.y - behind.y;

      // The sprite is drawn facing right, so travelling left is a horizontal mirror.
      // Mirroring also flips the sense of rotation, hence the tilt is scaled by the
      // facing direction rather than applied straight.
      const facing = dx >= 0 ? 1 : -1;
      const pitch = (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;
      const tilt =
        Math.max(Math.min(pitch * TILT_DAMPING, MAX_TILT_DEGREES), -MAX_TILT_DEGREES) *
        facing;

      butterfly.style.transform = transformFor(here.x, here.y, tilt, facing);

      // Expressing the trail in path units keeps it the same visual length whatever
      // a given route's total length happens to be.
      const sliceLength = Math.min(trailLength / total, 0.9) / TRAIL_SLICES;

      const length = sliceLength * SLICE_OVERLAP;

      sliceRefs.current.forEach((slice, index) => {
        if (!slice) return;

        // Slice 0 is the far tail; the last one ends exactly at the butterfly.
        const stepsBack = TRAIL_SLICES - 1 - index;
        // The routes are closed loops, so a slice running off the start of the path
        // continues from its end and the trail stays unbroken across the seam.
        let end = value - stepsBack * sliceLength;
        if (end < 0) end += 1;
        const start = end - length;

        // Dash values are normalised by pathLength=1. Where a slice does not cross
        // the seam this is simply: skip to `start`, draw, stop. Where it does, it
        // becomes two dashes, one at each end of the path.
        slice.setAttribute(
          "stroke-dasharray",
          start >= 0
            ? `0 ${start} ${length} 1`
            : `${end} ${1 + start - end} ${-start} 1`,
        );
      });
    },
    [transformFor, trailLength],
  );

  useMotionValueEvent(progress, "change", applyProgress);

  useEffect(() => {
    applyProgress(progress.get());
  }, [applyProgress, progress]);

  // With motion reduced there is no flight: the butterfly simply rests somewhere on
  // its route with the short trail behind it.
  useEffect(() => {
    if (!reduceMotion) return;
    progress.set(1);
  }, [reduceMotion, progress]);

  useEffect(() => {
    if (!isFlying) return;

    let cancelled = false;
    let running: { stop: () => void } | undefined;

    const flyCircuit = async () => {
      while (!cancelled) {
        // Resuming after the section scrolled away should only cover the distance
        // that is left, otherwise the butterfly crawls through the remainder.
        const remaining = 1 - progress.get();
        const flight = animate(progress, 1, {
          duration: duration * remaining,
          ease: "linear",
        });
        running = flight;
        await flight;
        if (cancelled) return;

        // Closed routes make this a seamless restart rather than a jump.
        progress.set(0);
      }
    };

    void flyCircuit();

    return () => {
      cancelled = true;
      running?.stop();
    };
  }, [isFlying, duration, progress]);

  /**
   * The path's own move-to command gives the butterfly a correct starting position
   * on the very first render, so it never flashes in the corner while waiting for
   * the geometry to be measurable.
   */
  const startTransform = useMemo(() => {
    const moveTo = /M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(path);
    if (!moveTo) return undefined;
    return transformFor(Number(moveTo[1]), Number(moveTo[2]), 0, 1);
  }, [path, transformFor]);

  const flapStyle = {
    "--butterfly-flap-duration": `${flapDuration}s`,
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`pointer-events-none absolute ${colorClassName} ${className}`}
      style={{
        width: `min(${areaWidth}px, ${maxViewportWidth}vw)`,
        aspectRatio: `${AREA.width} / ${AREA.height}`,
        opacity,
      }}
    >
      <svg
        viewBox={`0 0 ${AREA.width} ${AREA.height}`}
        fill="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        {/*
          The visible line carries the dash pattern, so it cannot also use
          stroke-dashoffset to reveal itself. These solid slices of the same path
          mask it into existence instead, and their stepped opacities are what make
          the trail fade out behind the butterfly.
        */}
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={-AREA.width * 0.1}
          y={-AREA.height * 0.1}
          width={AREA.width * 1.2}
          height={AREA.height * 1.2}
        >
          {Array.from({ length: TRAIL_SLICES }, (_, index) => (
            <path
              key={index}
              ref={(node) => {
                sliceRefs.current[index] = node;
              }}
              d={path}
              fill="none"
              stroke="white"
              strokeWidth={5}
              pathLength={1}
              strokeDasharray="0 1"
              opacity={(index + 1) / TRAIL_SLICES}
            />
          ))}
        </mask>

        <path
          ref={trailRef}
          d={path}
          className="butterfly-trail"
          mask={`url(#${maskId})`}
          opacity={trailOpacity}
        />
      </svg>

      {/*
        The sprite is a sibling rather than a foreignObject: keeping it in plain
        HTML avoids the browser inconsistencies around masked content inside SVG,
        and percentage transforms already put it in the same coordinate space.
      */}
      <div
        ref={butterflyRef}
        className={`butterfly-wing absolute top-0 left-0 ${isFlying ? "" : "paused"}`}
        style={{
          ...flapStyle,
          width: `${(spriteUnits.width / AREA.width) * 100}%`,
          height: `${(spriteUnits.height / AREA.height) * 100}%`,
          transform: startTransform,
        }}
      />
    </div>
  );
}
