/**
 * Flight paths for the drifting background butterflies. Every path is authored in
 * the 400 x 300 coordinate space that `ButterflyFlight` renders into, and each one
 * ends exactly on its own starting point: the trail wraps across that seam, so a
 * route that did not close would show a visible break once per circuit.
 *
 * The hero is deliberately left out. Its background is a full-bleed video behind a
 * dark scrim, which no silhouette reads against.
 */
export type ButterflyFlightId =
  | "about"
  | "aboutFar"
  | "photography"
  | "photographyLow"
  | "services"
  | "servicesHigh"
  | "ugc"
  | "ugcTrailing"
  | "testimonials"
  | "testimonialsLow"
  | "closing";

export type ButterflyFlightPreset = {
  path: string;
  /** Positioning classes within the host section. */
  className: string;
  /** Seconds for one full circuit. */
  duration: number;
  areaWidth: number;
  size: number;
  trailLength: number;
  flapDuration: number;
  colorClassName: string;
  opacity: number;
};

export const butterflyFlights: Record<ButterflyFlightId, ButterflyFlightPreset> = {
  // A long, shallow traverse with two dips, riding the left margin of the about copy.
  about: {
    path: "M 26 196 C 82 122 136 226 194 164 C 248 106 302 70 358 112 C 388 184 306 244 216 248 C 142 252 60 244 26 196",
    className: "top-10 left-0 lg:left-6",
    duration: 36,
    areaWidth: 400,
    size: 46,
    trailLength: 200,
    flapDuration: 0.7,
    colorClassName: "text-forest-deep",
    opacity: 0.8,
  },
  // A smaller, quicker one high on the opposite side, to read as further away.
  aboutFar: {
    path: "M 300 60 C 350 80 380 130 340 168 C 300 206 236 190 214 152 C 194 118 250 40 300 60",
    className: "right-0 bottom-6 lg:right-12",
    duration: 29,
    areaWidth: 300,
    size: 30,
    trailLength: 140,
    flapDuration: 0.62,
    colorClassName: "text-forest",
    opacity: 0.7,
  },
  // A tall wandering loop that doubles back on itself, over the collage's right edge.
  photography: {
    path: "M 178 44 C 268 58 318 132 268 182 C 220 230 122 224 96 174 C 72 128 132 92 190 116 C 246 138 272 216 216 254 C 168 286 96 264 78 210 C 60 156 110 60 178 44",
    className: "top-16 right-0 lg:right-4",
    duration: 46,
    areaWidth: 330,
    size: 36,
    trailLength: 170,
    flapDuration: 0.86,
    colorClassName: "text-ink",
    opacity: 0.78,
  },
  // A wide, shallow weave along the bottom of the collage.
  photographyLow: {
    path: "M 40 230 C 100 190 150 250 214 216 C 276 182 330 214 366 178 C 390 154 372 106 330 108 C 268 110 240 168 176 186 C 112 204 62 258 40 230",
    className: "bottom-4 left-0 lg:left-8",
    duration: 50,
    areaWidth: 390,
    size: 42,
    trailLength: 200,
    flapDuration: 0.9,
    colorClassName: "text-forest-deep",
    opacity: 0.74,
  },
  // A climb from the lower left into a slow turn, below the service cards.
  services: {
    path: "M 44 262 C 96 206 168 244 210 196 C 254 146 226 74 288 62 C 348 50 384 116 340 164 C 300 208 214 214 152 254 C 110 280 66 288 44 262",
    className: "right-0 bottom-8 lg:right-10",
    duration: 40,
    areaWidth: 380,
    size: 42,
    trailLength: 190,
    flapDuration: 0.78,
    colorClassName: "text-forest-deep",
    opacity: 0.78,
  },
  // A tight loop over the section heading, opposite the low one.
  servicesHigh: {
    path: "M 96 70 C 160 40 240 66 258 118 C 276 170 216 214 156 200 C 100 188 66 140 84 104 C 90 92 92 78 96 70",
    className: "top-10 left-0 lg:left-8",
    duration: 31,
    areaWidth: 300,
    size: 32,
    trailLength: 140,
    flapDuration: 0.66,
    colorClassName: "text-ink",
    opacity: 0.72,
  },
  // A wide rolling drift across the sage band. This section's wash is a mid green,
  // so the darkest token in the palette is what separates the sprite from it.
  ugc: {
    path: "M 32 118 C 96 58 150 158 214 118 C 276 80 330 138 356 196 C 372 240 300 268 226 244 C 158 222 108 250 62 226 C 26 206 18 156 32 118",
    className: "top-24 left-0 lg:left-10",
    duration: 42,
    areaWidth: 360,
    size: 40,
    trailLength: 185,
    flapDuration: 0.82,
    colorClassName: "text-forest-deep",
    opacity: 0.86,
  },
  // A slow vertical circuit down the far side of the sage band.
  ugcTrailing: {
    path: "M 350 90 C 300 60 230 84 206 130 C 182 176 214 226 264 236 C 318 246 372 214 372 166 C 372 130 366 102 350 90",
    className: "right-0 bottom-8 lg:right-10",
    duration: 48,
    areaWidth: 320,
    size: 34,
    trailLength: 150,
    flapDuration: 0.88,
    colorClassName: "text-forest-deep",
    opacity: 0.8,
  },
  // A shallow figure-eight tucked under the quote cards.
  testimonials: {
    path: "M 60 96 C 130 46 206 108 250 86 C 306 58 372 88 366 146 C 360 202 288 232 220 214 C 158 198 118 244 76 226 C 34 208 22 132 60 96",
    className: "top-14 right-0 lg:right-8",
    duration: 38,
    areaWidth: 360,
    size: 40,
    trailLength: 180,
    flapDuration: 0.74,
    colorClassName: "text-forest",
    opacity: 0.82,
  },
  // A compact circuit low on the opposite side from the figure-eight.
  testimonialsLow: {
    path: "M 70 210 C 40 176 62 128 108 122 C 156 116 196 152 190 196 C 184 240 132 262 96 244 C 78 234 70 222 70 210",
    className: "bottom-6 left-0 lg:left-10",
    duration: 33,
    areaWidth: 290,
    size: 30,
    trailLength: 130,
    flapDuration: 0.64,
    colorClassName: "text-ink",
    opacity: 0.72,
  },
  // Kept to the left half: the closing section's right column holds a video.
  closing: {
    path: "M 88 250 C 40 200 62 128 118 106 C 176 82 236 122 250 172 C 262 216 214 258 158 258 C 124 258 106 268 88 250",
    className: "bottom-10 left-0 lg:left-6",
    duration: 34,
    areaWidth: 300,
    size: 38,
    trailLength: 150,
    flapDuration: 0.8,
    colorClassName: "text-ink",
    opacity: 0.76,
  },
};
