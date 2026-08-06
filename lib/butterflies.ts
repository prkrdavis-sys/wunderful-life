/**
 * Flight paths for the drifting background butterflies. Every path is authored in
 * the 400 x 300 coordinate space that `ButterflyFlight` renders into, and each one
 * ends on its own starting point so a completed circuit loops without a jump.
 */
export type ButterflyFlightId = "hero" | "whatIsUgc" | "testimonials";

export type ButterflyFlightPreset = {
  path: string;
  /** Positioning classes within the host section. */
  className: string;
  /** Seconds for one full circuit. */
  duration: number;
  areaWidth: number;
  size: number;
  flapDuration: number;
  colorClassName: string;
  opacity: number;
};

export const butterflyFlights: Record<ButterflyFlightId, ButterflyFlightPreset> = {
  // A long, shallow traverse with two dips: the biggest and most prominent one,
  // riding the open space to the right of the centred hero copy.
  hero: {
    path: "M 26 196 C 82 122 136 226 194 164 C 248 106 302 70 358 112 C 388 184 306 244 216 248 C 142 252 60 244 26 196",
    className: "top-6 right-0 lg:right-10",
    duration: 34,
    areaWidth: 420,
    size: 48,
    flapDuration: 0.68,
    colorClassName: "text-indigo",
    opacity: 0.42,
  },
  // A tall wandering loop that doubles back on itself, tucked into the left margin.
  whatIsUgc: {
    path: "M 178 44 C 268 58 318 132 268 182 C 220 230 122 224 96 174 C 72 128 132 92 190 116 C 246 138 272 216 216 254 C 168 286 96 264 78 210 C 60 156 110 60 178 44",
    className: "top-20 left-0 lg:left-8",
    duration: 44,
    areaWidth: 330,
    size: 36,
    flapDuration: 0.84,
    colorClassName: "text-lavender-deep",
    opacity: 0.6,
  },
  // A climb from the lower left up into a slow turn, sitting below the quote cards.
  // This section's wallpaper is a dark blue sky, so the sprite is light rather than
  // inked; a burgundy silhouette disappears into it.
  testimonials: {
    path: "M 44 262 C 96 206 168 244 210 196 C 254 146 226 74 288 62 C 348 50 384 116 340 164 C 300 208 214 214 152 254 C 110 280 66 288 44 262",
    className: "bottom-6 right-0 lg:right-12",
    duration: 38,
    areaWidth: 380,
    size: 42,
    flapDuration: 0.76,
    colorClassName: "text-paper",
    opacity: 0.62,
  },
};
