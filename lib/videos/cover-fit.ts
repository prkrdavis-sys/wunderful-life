/**
 * Size a replaced media element so it covers or contains a box without
 * changing the source aspect ratio. Used instead of stretching width/height
 * to the container, which Safari often does when object-fit on <video> is
 * ignored.
 */
export type CoverFit = {
  width: number;
  height: number;
  left: number;
  top: number;
  scale: number;
};

export type MediaIntrinsicSize = {
  width: number;
  height: number;
};

export type VideoObjectFit = "cover" | "contain";

type FitVideoOptions = {
  sourceWidth: number;
  sourceHeight: number;
  containerWidth: number;
  containerHeight: number;
  devicePixelRatio: number;
  maxDevicePixelRatio: number;
};

function fitVideoToBox(
  options: FitVideoOptions,
  mode: VideoObjectFit,
): CoverFit | null {
  const sourceWidth = options.sourceWidth;
  const sourceHeight = options.sourceHeight;
  const containerWidth = options.containerWidth;
  const containerHeight = options.containerHeight;
  if (
    sourceWidth < 2 ||
    sourceHeight < 2 ||
    containerWidth < 2 ||
    containerHeight < 2
  ) {
    return null;
  }

  const dpr = Math.min(
    Math.max(options.devicePixelRatio, 1),
    options.maxDevicePixelRatio,
  );
  const widthScale = containerWidth / sourceWidth;
  const heightScale = containerHeight / sourceHeight;
  const cssScale =
    mode === "cover"
      ? Math.max(widthScale, heightScale)
      : Math.min(widthScale, heightScale);
  const cssWidth = sourceWidth * cssScale;
  const cssHeight = sourceHeight * cssScale;
  const width = Math.max(2, Math.round(cssWidth * dpr));
  const height = Math.max(
    2,
    Math.round((width * sourceHeight) / sourceWidth),
  );

  return {
    width,
    height,
    left: (containerWidth - cssWidth) / 2,
    top: (containerHeight - cssHeight) / 2,
    scale: 1 / dpr,
  };
}

export function coverFitForVideo(options: FitVideoOptions): CoverFit | null {
  return fitVideoToBox(options, "cover");
}

export function containFitForVideo(options: FitVideoOptions): CoverFit | null {
  return fitVideoToBox(options, "contain");
}

/** Still-frame canvas sized from the clip, never from the container. */
export function stillCanvasSize(
  sourceWidth: number,
  sourceHeight: number,
  devicePixelRatio: number,
): { width: number; height: number } | null {
  if (sourceWidth < 2 || sourceHeight < 2) return null;
  const scale = Math.min(Math.max(devicePixelRatio, 1), 2);
  const width = Math.max(2, Math.round(sourceWidth * scale));
  return {
    width,
    height: Math.max(2, Math.round((width * sourceHeight) / sourceWidth)),
  };
}
