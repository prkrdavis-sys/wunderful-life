/**
 * One-off asset build: turns the butterfly sprite sheet (cream artwork on a solid
 * black background) into a horizontal alpha matte strip used as a CSS mask.
 *
 * The sheet is not a clean uniform grid -- the two rows sit at different vertical
 * offsets and some wings overhang into the neighbouring cell -- so butterflies are
 * segmented by scanning for gaps rather than by dividing the canvas.
 *
 * Run manually, not part of `next build`:
 *   node scripts/build-butterfly-frames.mjs
 *   node scripts/build-butterfly-frames.mjs --debug   (also dumps per-frame PNGs)
 */
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "assets/butterfly-sprite-sheet.png";
const OUT_STRIP = "public/butterfly/flap-strip.png";
const DEBUG_DIR = "tmp-butterfly";

const ROWS = 2;
/** Luminance at or below this is clamped to fully transparent. */
const FLOOR = 26;
/** Alpha below this counts as empty when segmenting and measuring. */
const INK = 12;
/** Columns narrower than this are noise, not a butterfly. */
const MIN_RUN_WIDTH = 40;
/** Blank columns shorter than this are internal gaps, not a separator. */
const MAX_INTERNAL_GAP = 6;
/** Transparent margin around the aligned sprite. */
const PAD = 4;

/**
 * Segmented butterflies in the order they should play. Row 1 duplicates row 0's
 * poses, so only the first row is used. Sprites 0-4 run from a fully spread wing
 * to the most folded one; sprite 5 sits off that progression with a tilted body,
 * so it is dropped. Playing 0->4 and back down is one full beat with no reset pop.
 */
const FLAP_CYCLE = [0, 1, 2, 3, 4, 3, 2, 1];

const debug = process.argv.includes("--debug");

/** Luminance of the whole sheet, rescaled into an alpha matte. */
async function readSheetMatte() {
  const image = sharp(SOURCE);
  const { width, height } = await image.metadata();
  const grey = await image.clone().greyscale().raw().toBuffer();

  const alpha = Buffer.alloc(grey.length);
  for (let i = 0; i < grey.length; i += 1) {
    const luminance = grey[i];
    alpha[i] =
      luminance <= FLOOR
        ? 0
        : Math.round(((luminance - FLOOR) / (255 - FLOOR)) * 255);
  }

  return { alpha, width, height };
}

/** Splits a row band into per-butterfly column ranges using blank-column gaps. */
function findColumnRuns(alpha, width, top, bottom) {
  const occupied = [];
  for (let x = 0; x < width; x += 1) {
    let hasInk = false;
    for (let y = top; y < bottom; y += 1) {
      if (alpha[y * width + x] >= INK) {
        hasInk = true;
        break;
      }
    }
    occupied.push(hasInk);
  }

  const runs = [];
  let start = -1;
  let gap = 0;
  for (let x = 0; x < width; x += 1) {
    if (occupied[x]) {
      if (start < 0) start = x;
      gap = 0;
      continue;
    }
    if (start < 0) continue;
    gap += 1;
    if (gap > MAX_INTERNAL_GAP) {
      runs.push({ from: start, to: x - gap });
      start = -1;
      gap = 0;
    }
  }
  if (start >= 0) runs.push({ from: start, to: width - 1 });

  return runs.filter((run) => run.to - run.from + 1 >= MIN_RUN_WIDTH);
}

function measureBounds(alpha, width, run, top, bottom) {
  let minX = run.to;
  let maxX = run.from;
  let minY = bottom;
  let maxY = top;

  for (let y = top; y < bottom; y += 1) {
    for (let x = run.from; x <= run.to; x += 1) {
      if (alpha[y * width + x] < INK) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  return { minX, minY, maxX, maxY };
}

/** Copies a bounding box out of the sheet matte into its own tight buffer. */
function cropMatte(alpha, width, bounds) {
  const cropWidth = bounds.maxX - bounds.minX + 1;
  const cropHeight = bounds.maxY - bounds.minY + 1;
  const out = Buffer.alloc(cropWidth * cropHeight);

  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      out[y * cropWidth + x] = alpha[(bounds.minY + y) * width + bounds.minX + x];
    }
  }

  return { data: out, width: cropWidth, height: cropHeight };
}

/** White RGB with the supplied matte as its alpha channel. */
function matteToPng(matte) {
  const rgba = Buffer.alloc(matte.width * matte.height * 4);
  for (let i = 0; i < matte.data.length; i += 1) {
    rgba[i * 4] = 255;
    rgba[i * 4 + 1] = 255;
    rgba[i * 4 + 2] = 255;
    rgba[i * 4 + 3] = matte.data[i];
  }
  return sharp(rgba, {
    raw: { width: matte.width, height: matte.height, channels: 4 },
  }).png();
}

async function main() {
  const { alpha, width, height } = await readSheetMatte();
  const bandHeight = Math.floor(height / ROWS);
  console.log(`sheet ${width}x${height}, band height ${bandHeight}`);

  const sprites = [];
  for (let row = 0; row < ROWS; row += 1) {
    const top = row * bandHeight;
    const bottom = Math.min(top + bandHeight, height);
    const runs = findColumnRuns(alpha, width, top, bottom);
    console.log(`row ${row}: ${runs.length} butterflies`);
    for (const run of runs) {
      const bounds = measureBounds(alpha, width, run, top, bottom);
      const matte = cropMatte(alpha, width, bounds);
      console.log(
        `  x ${bounds.minX}-${bounds.maxX}, y ${bounds.minY}-${bounds.maxY} (${matte.width}x${matte.height})`,
      );
      sprites.push(matte);
    }
  }

  // The head and tail sit on the lower-left of the artwork and stay put while the
  // wing sweeps up and to the right, so anchoring every frame by its left and
  // bottom edges keeps the body from sliding as the mask steps between frames.
  const cellWidth = Math.max(...sprites.map((s) => s.width)) + PAD * 2;
  const cellHeight = Math.max(...sprites.map((s) => s.height)) + PAD * 2;
  console.log(`aligned cell ${cellWidth}x${cellHeight}`);

  const frames = await Promise.all(
    sprites.map(async (matte) => {
      const png = await matteToPng(matte).toBuffer();
      const aligned = await sharp({
        create: {
          width: cellWidth,
          height: cellHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          { input: png, left: PAD, top: cellHeight - PAD - matte.height },
        ])
        .png()
        .toBuffer();

      // Flopping each already-aligned cell keeps every frame's body in the same
      // place while turning the left-facing artwork into a right-facing sprite,
      // so a 0deg rotation matches a rightward heading in the component.
      return sharp(aligned).flop().png().toBuffer();
    }),
  );

  if (debug) {
    await rm(DEBUG_DIR, { recursive: true, force: true });
    await mkdir(DEBUG_DIR, { recursive: true });
    const reviewBackground = { r: 45, g: 42, b: 38, alpha: 1 };
    await Promise.all(
      frames.map((frame, index) =>
        sharp({
          create: {
            width: cellWidth,
            height: cellHeight,
            channels: 4,
            background: reviewBackground,
          },
        })
          .composite([{ input: frame }])
          .png()
          .toFile(
            path.join(DEBUG_DIR, `frame-${String(index).padStart(2, "0")}.png`),
          ),
      ),
    );
    await sharp({
      create: {
        width: cellWidth * frames.length,
        height: cellHeight,
        channels: 4,
        background: reviewBackground,
      },
    })
      .composite(
        frames.map((input, index) => ({ input, left: index * cellWidth, top: 0 })),
      )
      .png()
      .toFile(path.join(DEBUG_DIR, "contact-sheet.png"));
    console.log(`debug frames written to ${DEBUG_DIR}/`);
  }

  await mkdir(path.dirname(OUT_STRIP), { recursive: true });
  await sharp({
    create: {
      width: cellWidth * FLAP_CYCLE.length,
      height: cellHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(
      FLAP_CYCLE.map((frameIndex, position) => ({
        input: frames[frameIndex],
        left: position * cellWidth,
        top: 0,
      })),
    )
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(OUT_STRIP);

  console.log(
    `wrote ${OUT_STRIP}: ${FLAP_CYCLE.length} frames, ${cellWidth}x${cellHeight} each`,
  );
}

main();
