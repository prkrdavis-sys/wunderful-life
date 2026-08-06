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
 * trail emerges from the creature and the wing sweeps around it. The x anchor is
 * the shared opaque body core across the flap frames; anchoring at the old 0.74
 * value put the newest dash a few pixels in front of the body.
 */
const BODY_ANCHOR = { x: 0.67, y: 0.62 };

/** Fraction of the path sampled either side of the butterfly to read its heading. */
const HEADING_STEP = 0.004;
/** A butterfly drifts rather than nose-dives, so the pitch is damped and capped. */
const TILT_DAMPING = 0.7;
const MAX_TILT_DEGREES = 26;

/**
 * The trail is drawn as one element per dash rather than as a dashed line revealed
 * by a mask. A mask selects a region of the canvas, so wherever a route passed near
 * or across itself the mask over the tail also uncovered the stretch of line running
 * the other way, printing dashes ahead of the butterfly. Addressing each dash by its
 * distance along the route removes that whole class of fault: a dash can only ever
 * be placed behind the butterfly, whatever shape the route is.
 */
const DASH_LENGTH = 3;
const DASH_GAP = 7;
const DASH_PERIOD = DASH_LENGTH + DASH_GAP;

/** Spacing of the sampled geometry the dashes are built from, in path units. */
const SAMPLE_STEP = 1.5;

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
  const geometryRef = useRef<SVGPathElement>(null);
  const dashRefs = useRef<(SVGPathElement | null)[]>([]);
  const butterflyRef = useRef<HTMLDivElement>(null);
  const curveRef = useRef<{ points: { x: number; y: number }[]; total: number } | null>(
    null,
  );

  const reduceMotion = useReducedMotion();
  const inView = useInView(containerRef, { amount: 0.15 });
  const isFlying = inView && !reduceMotion;

  const progress = useMotionValue(0);

  // One element per dash, sized to cover the longest trail this route will show.
  const dashCount = Math.ceil(trailLength / DASH_PERIOD) + 1;

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
      const curve = curveRef.current;
      const butterfly = butterflyRef.current;
      if (!curve || !butterfly) return;

      const { points, total } = curve;
      const last = points.length - 1;

      // Distances wrap, so the tail crossing the start of a closed route simply
      // continues from its end.
      const pointAt = (distance: number) => {
        const wrapped = ((distance % total) + total) % total;
        const scaled = (wrapped / total) * last;
        const index = Math.floor(scaled);
        const fraction = scaled - index;
        const from = points[index];
        const to = points[index + 1] ?? points[0];
        return {
          x: from.x + (to.x - from.x) * fraction,
          y: from.y + (to.y - from.y) * fraction,
        };
      };

      const head = value * total;
      const here = pointAt(head);
      const ahead = pointAt(head + HEADING_STEP * total);
      const behind = pointAt(head - HEADING_STEP * total);
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

      // Dashes sit on a fixed grid measured from the start of the route, so they
      // stay pinned to the route instead of sliding along with the butterfly.
      const newest = Math.floor(head / DASH_PERIOD);

      for (let index = 0; index < dashCount; index += 1) {
        const dash = dashRefs.current[index];
        if (!dash) continue;

        const start = (newest - index) * DASH_PERIOD;
        // Clipping the leading dash at the butterfly is what keeps the trail behind
        // it: the dash currently emerging is only drawn as far as it has emerged.
        const end = Math.min(start + DASH_LENGTH, head);
        const age = (head - end) / trailLength;

        if (end <= start || age >= 1) {
          dash.style.opacity = "0";
          continue;
        }

        const middle = pointAt((start + end) / 2);
        const from = pointAt(start);
        const to = pointAt(end);
        dash.setAttribute(
          "d",
          `M ${from.x.toFixed(1)} ${from.y.toFixed(1)}` +
            ` L ${middle.x.toFixed(1)} ${middle.y.toFixed(1)}` +
            ` L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`,
        );
        dash.style.opacity = (1 - age).toFixed(3);
      }
    },
    [transformFor, trailLength, dashCount],
  );

  /**
   * The route is sampled once into a lookup table, so placing dashes each frame is
   * arithmetic rather than repeated getPointAtLength calls across every butterfly.
   */
  useEffect(() => {
    const geometry = geometryRef.current;
    if (!geometry) return;

    const total = geometry.getTotalLength();
    if (!total) return;

    const steps = Math.max(2, Math.ceil(total / SAMPLE_STEP));
    curveRef.current = {
      total,
      points: Array.from({ length: steps + 1 }, (_, index) => {
        const { x, y } = geometry.getPointAtLength((index / steps) * total);
        return { x, y };
      }),
    };

    applyProgress(progress.get());
  }, [path, applyProgress, progress]);

  useMotionValueEvent(progress, "change", applyProgress);

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
        {/* Never painted: this carries the route so its geometry can be measured. */}
        <path ref={geometryRef} d={path} fill="none" stroke="none" />

        <g opacity={trailOpacity}>
          {Array.from({ length: dashCount }, (_, index) => (
            <path
              key={index}
              ref={(node) => {
                dashRefs.current[index] = node;
              }}
              className="butterfly-trail"
              opacity={0}
            />
          ))}
        </g>
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
