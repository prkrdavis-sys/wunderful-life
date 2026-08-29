"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { butterflyFlights, type ButterflyFlightId } from "@/lib/butterflies";
import { sampleClosedCubicPath } from "@/lib/sampleSvgPath";

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
 * unwrapped distance along the route keeps the tail behind the body and lets it
 * wrap a closed loop without a chord across the seam.
 */
const DASH_LENGTH = 3;
const DASH_GAP = 7;
const DASH_PERIOD = DASH_LENGTH + DASH_GAP;

/** Spacing of the sampled geometry the dashes are built from, in path units. */
const SAMPLE_STEP = 1.5;
/**
 * A dash that straddles the loop close must not be drawn as one straight segment:
 * those two samples sit on opposite sides of the route and the line between them
 * flashes across the canvas. Anything longer than this is treated as a wrap.
 */
const MAX_DASH_SEGMENT = DASH_LENGTH * 2;

type TrailPoint = { x: number; y: number };

function formatPoint(point: TrailPoint) {
  return `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
}

function dashPath(
  start: number,
  end: number,
  pointAt: (distance: number) => TrailPoint,
) {
  const span = end - start;
  const samples = Math.max(2, Math.ceil(span / SAMPLE_STEP) + 1);
  let commands = "";
  let previous: TrailPoint | null = null;

  for (let sample = 0; sample < samples; sample += 1) {
    const distance = start + (span * sample) / (samples - 1);
    const point = pointAt(distance);
    if (!previous) {
      commands = `M ${formatPoint(point)}`;
    } else if (Math.hypot(point.x - previous.x, point.y - previous.y) > MAX_DASH_SEGMENT) {
      commands += ` M ${formatPoint(point)}`;
    } else {
      commands += ` L ${formatPoint(point)}`;
    }
    previous = point;
  }

  return commands;
}

/**
 * Drops a preset butterfly into a section, layered between the section's
 * background wash and its `z-10` content.
 */
export function SectionButterfly({ flight }: { flight: ButterflyFlightId }) {
  const preset = butterflyFlights[flight];

  return (
    <ButterflyFlight
      {...preset}
      startDelay={flight === "intro" ? 1.2 : 0}
      className={`z-[5] ${preset.className}`}
    />
  );
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
  /** Seconds to wait after mount before flying. */
  startDelay?: number;
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
  startDelay = 0,
}: ButterflyFlightProps) {
  const [delayElapsed, setDelayElapsed] = useState(startDelay <= 0);
  const dashRefs = useRef<(SVGPathElement | null)[]>([]);
  const butterflyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const curve = useMemo(() => sampleClosedCubicPath(path, SAMPLE_STEP), [path]);

  const isFlying = delayElapsed && curve.total > 0;

  useEffect(() => {
    if (startDelay <= 0) return;
    const timeoutId = window.setTimeout(() => setDelayElapsed(true), startDelay * 1000);
    return () => window.clearTimeout(timeoutId);
  }, [startDelay]);

  const dashCount = Math.ceil(trailLength / DASH_PERIOD) + 1;
  const spriteUnits = { width: size, height: (size * SPRITE.height) / SPRITE.width };

  /**
   * Positions the sprite entirely in percentages of its own box, which keeps the
   * transform resolution-independent. The inline transform origin is fixed at
   * the element's top-left so, read right to left, the sprite's body is shifted to
   * the origin, mirrored, pitched, then carried out to the path.
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

  const applyProgress = useCallback(
    (value: number) => {
      const butterfly = butterflyRef.current;
      if (!curve.total || !butterfly) return;

      const { points, total } = curve;
      const last = points.length - 1;

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

      const facing = dx >= 0 ? 1 : -1;
      const pitch = (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;
      const tilt =
        Math.max(Math.min(pitch * TILT_DAMPING, MAX_TILT_DEGREES), -MAX_TILT_DEGREES) *
        facing;

      butterfly.style.transform = transformFor(here.x, here.y, tilt, facing);

      const newest = Math.floor(head / DASH_PERIOD);

      for (let index = 0; index < dashCount; index += 1) {
        const dash = dashRefs.current[index];
        if (!dash) continue;

        const start = (newest - index) * DASH_PERIOD;
        const end = Math.min(start + DASH_LENGTH, head);
        const age = (head - end) / trailLength;

        if (end <= start || end <= 0 || age >= 1) {
          dash.style.opacity = "0";
          continue;
        }

        dash.setAttribute("d", dashPath(start, end, pointAt));
        dash.style.opacity = (1 - age).toFixed(3);
      }
    },
    [curve, transformFor, trailLength, dashCount],
  );

  useLayoutEffect(() => {
    applyProgress(progressRef.current);
  }, [applyProgress]);

  useEffect(() => {
    if (!isFlying) return;

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      progressRef.current += dt / duration;
      applyProgress(progressRef.current);
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [isFlying, duration, applyProgress]);

  const flapStyle = {
    "--butterfly-flap-duration": `${flapDuration}s`,
  } as CSSProperties;

  return (
    <div
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
        The mask lives on an inner node. Safari drops transforms on the same
        element that carries -webkit-mask-image, which parked every butterfly.
      */}
      <div
        ref={butterflyRef}
        className="absolute top-0 left-0"
        style={{
          width: `${(spriteUnits.width / AREA.width) * 100}%`,
          height: `${(spriteUnits.height / AREA.height) * 100}%`,
          transformOrigin: "0 0",
        }}
      >
        <div
          className={`butterfly-wing h-full w-full ${isFlying ? "" : "paused"}`}
          style={flapStyle}
        />
      </div>
    </div>
  );
}
