/**
 * Flight paths for the drifting background butterflies. Every path is authored in
 * the 400 x 300 coordinate space that `ButterflyFlight` renders into, and each one
 * ends exactly on its own starting point, arriving along the direction it leaves in:
 * the trail wraps across that seam, so a route that did not close smoothly would show
 * a break or a cusp once per circuit.
 *
 * A route must also not cross or graze its own track. The trail behind the butterfly
 * is what is left of where it has been, so on a self-crossing route the butterfly
 * flies back over its own older dashes and they read as a line drawn in front of it.
 *
 * The hero is deliberately left out. Its background is a full-bleed video behind a
 * dark scrim, which no silhouette reads against.
 *
 * Routes must not cross any heading: a butterfly tracking over the words of a title
 * reads as a mistake. Vertical placement is therefore a percentage of the host
 * section rather than a pixel offset, so a route keeps its position relative to the
 * layout as sections reflow and headings move between breakpoints. Each placement
 * below was picked by measuring the flight box against the rendered glyph boxes of
 * every heading in its section, at 390, 768, 1024 and 1600 wide; the recorded
 * clearance is the worst of those four.
 */
export type ButterflyFlightId =
  | "about"
  | "aboutFar"
  | "aboutGallery"
  | "photography"
  | "photographyLow"
  | "photographyEdge"
  | "services"
  | "servicesHigh"
  | "servicesLow"
  | "brandsBand"
  | "stats"
  | "workBand"
  | "workMarquee"
  | "ugc"
  | "ugcTrailing"
  | "ugcLower"
  | "testimonials"
  | "testimonialsLow"
  | "testimonialsEdge"
  | "closing"
  | "closingFar";

export type ButterflyFlightPreset = {
  path: string;
  /** Positioning classes within the host section. */
  className: string;
  /** Seconds for one full circuit. */
  duration: number;
  areaWidth: number;
  /** vw ceiling on the flight area, which shrinks the route on narrow screens. */
  maxViewportWidth?: number;
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
    // Below the "About Me" heading. Clearance 188px.
    className: "top-[26%] left-3",
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
    className: "bottom-6 right-12",
    duration: 29,
    areaWidth: 300,
    size: 30,
    trailLength: 140,
    flapDuration: 0.62,
    colorClassName: "text-forest",
    opacity: 0.7,
  },
  // A tall, leaning circuit over the collage's right edge.
  photography: {
    path: "M 196 44 C 264 44 316 88 318 142 C 320 196 286 244 226 258 C 166 272 106 244 84 196 C 62 148 78 66 140 48 C 158 43 178 43 196 44",
    className: "top-16 right-4",
    duration: 46,
    areaWidth: 330,
    size: 36,
    trailLength: 170,
    flapDuration: 0.86,
    colorClassName: "text-ink",
    opacity: 0.78,
  },
  // A wide, shallow circuit along the bottom of the collage.
  photographyLow: {
    path: "M 40 176 C 40 140 108 108 196 112 C 268 115 344 132 366 158 C 384 180 350 214 268 226 C 186 238 96 232 56 212 C 38 202 40 190 40 176",
    className: "bottom-4 left-8",
    duration: 50,
    areaWidth: 390,
    size: 42,
    trailLength: 200,
    flapDuration: 0.9,
    colorClassName: "text-forest-deep",
    opacity: 0.74,
  },
  // A climb into a slow turn, riding the right margin of the service cards.
  services: {
    path: "M 44 262 C 96 206 168 244 210 196 C 254 146 226 74 288 62 C 348 50 384 116 340 164 C 300 208 214 214 152 254 C 110 280 66 288 44 262",
    // The service cards leave only narrow gaps between their titles, so this route
    // is small and hugs the right edge. Clearance 37px.
    className: "top-[20%] right-3",
    duration: 40,
    areaWidth: 200,
    maxViewportWidth: 31,
    size: 56,
    trailLength: 190,
    flapDuration: 0.78,
    colorClassName: "text-forest-deep",
    opacity: 0.78,
  },
  // A tight loop beside the cards. Sits below the scalloped banner that laps over
  // the top of this section, where a silhouette would be lost. Clearance 53px.
  servicesHigh: {
    path: "M 96 70 C 160 40 240 66 258 118 C 276 170 216 214 156 200 C 100 188 66 140 84 104 C 90 92 92 78 96 70",
    className: "top-[22%] left-3",
    duration: 31,
    areaWidth: 200,
    maxViewportWidth: 31,
    size: 52,
    trailLength: 140,
    flapDuration: 0.66,
    colorClassName: "text-ink",
    opacity: 0.72,
  },
  // A wide rolling drift across the sage band. This section's wash is a mid green,
  // so the darkest token in the palette is what separates the sprite from it.
  ugc: {
    path: "M 32 118 C 96 58 150 158 214 118 C 276 80 330 138 356 196 C 372 240 300 268 226 244 C 158 222 108 250 62 226 C 26 206 18 156 32 118",
    // Below the "What Is UGC?" heading. Clearance 209px.
    className: "top-[34%] left-3",
    duration: 42,
    areaWidth: 360,
    size: 40,
    trailLength: 185,
    flapDuration: 0.82,
    colorClassName: "text-forest-deep",
    opacity: 0.86,
  },
  // A slow vertical circuit down the far side of the sage band, opposite `ugc` and
  // clear of the benefits heading below it. Clearance 118px.
  ugcTrailing: {
    path: "M 350 90 C 300 60 230 84 206 130 C 182 176 214 226 264 236 C 318 246 372 214 372 166 C 372 130 366 102 350 90",
    className: "top-[38%] right-10",
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
    // Alongside the quote cards, clear of the "Kind Words" heading. Clearance 94px.
    className: "top-[40%] right-3",
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
    className: "bottom-6 left-10",
    duration: 33,
    areaWidth: 290,
    size: 30,
    trailLength: 130,
    flapDuration: 0.64,
    colorClassName: "text-ink",
    opacity: 0.72,
  },
  // Kept to the left, clear of the closing heading and its video. Clearance 320px.
  closing: {
    path: "M 88 250 C 40 200 62 128 118 106 C 176 82 236 122 250 172 C 262 216 214 258 158 258 C 124 258 106 268 88 250",
    className: "top-[2%] left-3",
    duration: 34,
    areaWidth: 220,
    maxViewportWidth: 46,
    size: 46,
    trailLength: 150,
    flapDuration: 0.8,
    colorClassName: "text-ink",
    opacity: 0.76,
  },
  // A compact loop under the gallery grid, clear of the "A little more" heading. Clearance 96px.
  aboutGallery: {
    path: "M 64 218 C 112 178 188 186 228 222 C 268 258 224 288 162 282 C 100 276 44 262 64 218",
    className: "bottom-10 right-6",
    duration: 37,
    areaWidth: 280,
    size: 34,
    trailLength: 155,
    flapDuration: 0.76,
    colorClassName: "text-forest",
    opacity: 0.74,
  },
  // A tight circuit high on the left, opposite the existing right-edge loop.
  photographyEdge: {
    path: "M 56 72 C 104 40 172 52 192 100 C 212 148 164 184 112 176 C 60 168 32 116 56 72",
    className: "top-14 left-5",
    duration: 35,
    areaWidth: 260,
    size: 32,
    trailLength: 145,
    flapDuration: 0.68,
    colorClassName: "text-ink",
    opacity: 0.72,
  },
  // A wide drift along the bottom of the service cards, below their titles.
  servicesLow: {
    path: "M 72 238 C 132 198 222 208 282 234 C 342 260 312 288 232 284 C 152 280 52 278 72 238",
    className: "bottom-8 left-6",
    duration: 44,
    areaWidth: 360,
    size: 38,
    trailLength: 175,
    flapDuration: 0.84,
    colorClassName: "text-forest-deep",
    opacity: 0.76,
  },
  // A small loop tucked under the brand logos, clear of the script heading. Clearance 72px.
  brandsBand: {
    path: "M 296 82 C 336 62 376 92 366 132 C 356 172 306 182 266 162 C 236 146 256 102 296 82",
    className: "bottom-3 right-8",
    duration: 28,
    areaWidth: 240,
    maxViewportWidth: 34,
    size: 30,
    trailLength: 125,
    flapDuration: 0.64,
    colorClassName: "text-paper",
    opacity: 0.7,
  },
  // A quick circuit in the corner of the stats band, clear of the script figures.
  stats: {
    path: "M 58 188 C 98 148 158 153 173 193 C 188 233 128 253 78 243 C 48 236 43 208 58 188",
    className: "bottom-1 right-6",
    duration: 26,
    areaWidth: 220,
    maxViewportWidth: 32,
    size: 30,
    trailLength: 120,
    flapDuration: 0.62,
    colorClassName: "text-paper",
    opacity: 0.68,
  },
  // A shallow loop low on the forest title band, below the filter chips.
  workBand: {
    path: "M 52 228 C 108 188 184 196 246 212 C 312 230 368 218 380 186 C 392 154 328 118 242 112 C 156 106 62 126 50 164 C 44 188 46 212 52 228",
    className: "bottom-3 left-4",
    duration: 41,
    areaWidth: 340,
    size: 36,
    trailLength: 165,
    flapDuration: 0.8,
    colorClassName: "text-paper",
    opacity: 0.74,
  },
  // A rolling traverse along the phone marquee, clear of the work heading above.
  workMarquee: {
    path: "M 36 196 C 92 136 156 226 214 164 C 268 106 322 70 358 112 C 388 184 306 244 216 248 C 142 252 60 244 36 196",
    className: "top-[48%] right-3",
    duration: 43,
    areaWidth: 380,
    size: 40,
    trailLength: 180,
    flapDuration: 0.78,
    colorClassName: "text-forest-deep",
    opacity: 0.8,
  },
  // A slow circuit low on the sage band, opposite the main UGC drift.
  ugcLower: {
    path: "M 44 202 C 92 162 156 174 200 210 C 244 246 200 282 140 274 C 80 266 24 250 44 202",
    className: "bottom-10 left-5",
    duration: 45,
    areaWidth: 300,
    size: 36,
    trailLength: 160,
    flapDuration: 0.86,
    colorClassName: "text-forest-deep",
    opacity: 0.82,
  },
  // A mid-height loop on the left margin, between the heading block and quote cards.
  testimonialsEdge: {
    path: "M 58 118 C 110 74 190 86 230 130 C 270 174 222 226 162 220 C 102 214 38 174 58 118",
    className: "top-[52%] left-4",
    duration: 36,
    areaWidth: 300,
    size: 34,
    trailLength: 150,
    flapDuration: 0.72,
    colorClassName: "text-forest",
    opacity: 0.78,
  },
  // A compact loop on the far right, clear of the script CTA heading. Clearance 140px.
  closingFar: {
    path: "M 276 238 C 236 198 176 208 156 250 C 136 292 196 290 244 266 C 292 242 316 278 276 238",
    className: "bottom-8 right-6",
    duration: 32,
    areaWidth: 260,
    size: 32,
    trailLength: 135,
    flapDuration: 0.7,
    colorClassName: "text-forest",
    opacity: 0.74,
  },
};
