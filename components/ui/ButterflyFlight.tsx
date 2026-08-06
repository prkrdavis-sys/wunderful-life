"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
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
/** How long the finished trail lingers before fading out for the next circuit. */
const TRAIL_HOLD_SECONDS = 1.2;
const TRAIL_FADE_SECONDS = 1.6;

/**
 * Drops a preset butterfly into a section, layered between the section's
 * background image and its `z-10` content.
 */
export function SectionButterfly({ flight }: { flight: ButterflyFlightId }) {
  const preset = butterflyFlights[flight];

  return <ButterflyFlight {...preset} className={`z-[5] ${preset.className}`} />;
}

type ButterflyFlightProps = {
  /** SVG path data authored in a 400 x 300 space. Should end near where it starts. */
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
  flapDuration = 0.72,
  colorClassName = "text-indigo",
  opacity = 0.5,
  trailOpacity = 0.45,
}: ButterflyFlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const butterflyRef = useRef<HTMLDivElement>(null);

  const reduceMotion = useReducedMotion();
  const inView = useInView(containerRef, { amount: 0.15 });
  const isFlying = inView && !reduceMotion;

  const progress = useMotionValue(0);
  const trailFade = useMotionValue(1);
  const trailAlpha = useTransform(trailFade, (fade) => fade * trailOpacity);

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
  // the SVG is in the DOM, so position is applied imperatively rather than through
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
    },
    [transformFor],
  );

  useMotionValueEvent(progress, "change", applyProgress);

  useEffect(() => {
    applyProgress(progress.get());
  }, [applyProgress, progress]);

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

  // With motion reduced there is no flight: the whole route is already drawn and
  // the butterfly rests at the end of it, which on a closed path is where it began.
  useEffect(() => {
    if (!reduceMotion) return;
    progress.set(1);
    trailFade.set(1);
  }, [reduceMotion, progress, trailFade]);

  useEffect(() => {
    if (!isFlying) return;

    let cancelled = false;
    let running: { stop: () => void } | undefined;

    const flyCircuit = async () => {
      while (!cancelled) {
        trailFade.set(1);

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

        // The completed route lingers before being wiped, so the delay belongs to
        // the fade itself; animating trailFade to the value it already holds would
        // resolve immediately rather than waiting.
        const fade = animate(trailFade, 0, {
          duration: TRAIL_FADE_SECONDS,
          delay: TRAIL_HOLD_SECONDS,
          ease: "easeOut",
        });
        running = fade;
        await fade;
        if (cancelled) return;

        progress.set(0);
      }
    };

    void flyCircuit();

    return () => {
      cancelled = true;
      running?.stop();
    };
  }, [isFlying, duration, progress, trailFade]);

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
          stroke-dashoffset to draw itself on. A solid stroke of the same path,
          revealed by pathLength, masks it into existence instead.
        */}
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={-AREA.width * 0.1}
          y={-AREA.height * 0.1}
          width={AREA.width * 1.2}
          height={AREA.height * 1.2}
        >
          <motion.path
            d={path}
            fill="none"
            stroke="white"
            strokeWidth={5}
            strokeLinecap="round"
            style={{ pathLength: progress }}
          />
        </mask>

        <motion.path
          ref={trailRef}
          d={path}
          className="butterfly-trail"
          mask={`url(#${maskId})`}
          style={{ opacity: trailAlpha }}
        />
      </svg>

      {/*
        The sprite is a sibling rather than a foreignObject: keeping it in plain
        HTML avoids the browser inconsistencies around masked content inside SVG,
        and the scale factor already puts it in the same coordinate space.
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
