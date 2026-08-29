export type PathPoint = { x: number; y: number };

function cubicAt(
  start: PathPoint,
  controlA: PathPoint,
  controlB: PathPoint,
  end: PathPoint,
  t: number,
): PathPoint {
  const rest = 1 - t;
  const restSq = rest * rest;
  const tSq = t * t;
  return {
    x:
      restSq * rest * start.x +
      3 * restSq * t * controlA.x +
      3 * rest * tSq * controlB.x +
      tSq * t * end.x,
    y:
      restSq * rest * start.y +
      3 * restSq * t * controlA.y +
      3 * rest * tSq * controlB.y +
      tSq * t * end.y,
  };
}

function tokenize(path: string): string[] {
  return path.match(/[MLCZmlcz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
}

/**
 * Sample a closed cubic SVG path into evenly spaced points. Flight code uses
 * this instead of `getTotalLength`, which some browsers report as 0 until the
 * path has been painted.
 */
export function sampleClosedCubicPath(
  path: string,
  spacing: number,
): { points: PathPoint[]; total: number } {
  const tokens = tokenize(path);
  const dense: PathPoint[] = [];
  let index = 0;
  let current = { x: 0, y: 0 };

  const read = () => {
    const value = Number(tokens[index]);
    index += 1;
    return Number.isFinite(value) ? value : 0;
  };

  const addCubic = (controlA: PathPoint, controlB: PathPoint, end: PathPoint) => {
    for (let sample = 1; sample <= 16; sample += 1) {
      dense.push(cubicAt(current, controlA, controlB, end, sample / 16));
    }
    current = end;
  };

  while (index < tokens.length) {
    const raw = tokens[index];
    index += 1;
    const command = raw.toUpperCase();

    if (command === "M") {
      current = { x: read(), y: read() };
      if (dense.length === 0) dense.push(current);
      continue;
    }

    if (command === "C") {
      addCubic(
        { x: read(), y: read() },
        { x: read(), y: read() },
        { x: read(), y: read() },
      );
      continue;
    }

    if (command === "Z") break;

    if (!Number.isNaN(Number(raw))) {
      index -= 1;
      addCubic(
        { x: read(), y: read() },
        { x: read(), y: read() },
        { x: read(), y: read() },
      );
    }
  }

  if (dense.length < 2) return { points: dense, total: 0 };

  const lengths = [0];
  for (let point = 1; point < dense.length; point += 1) {
    lengths.push(
      lengths[point - 1] +
        Math.hypot(
          dense[point].x - dense[point - 1].x,
          dense[point].y - dense[point - 1].y,
        ),
    );
  }

  const total = lengths[lengths.length - 1];
  if (!total) return { points: dense, total: 0 };

  const steps = Math.max(2, Math.ceil(total / spacing));
  const points: PathPoint[] = [];
  let cursor = 0;

  for (let step = 0; step <= steps; step += 1) {
    const target = (step / steps) * total;
    while (cursor < lengths.length - 2 && lengths[cursor + 1] < target) {
      cursor += 1;
    }
    const from = dense[cursor];
    const to = dense[cursor + 1] ?? from;
    const span = lengths[cursor + 1] - lengths[cursor] || 1;
    const fraction = (target - lengths[cursor]) / span;
    points.push({
      x: from.x + (to.x - from.x) * fraction,
      y: from.y + (to.y - from.y) * fraction,
    });
  }

  return { points, total };
}
