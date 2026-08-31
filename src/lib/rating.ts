export function ratingToDisplay(rating: number): string {
  return (rating / 10).toFixed(1);
}

/**
 * Hypsometric tints — the colour language atlases have used for elevation for
 * two centuries: deep water, shelf, lowland, steppe, highland, snow. A rating
 * is read as height, so a 9.6 is a summit and a 3.2 is deep water.
 *
 * Why this and not the previous red→green ramp: that one interpolated HSL hue
 * at a fixed 50% lightness, so 2.0 and 8.0 were the *same grey*. It carried no
 * information in greyscale, for red-green colour blindness (~8% of men), or in
 * a 6px globe marker. This ramp climbs monotonically in lightness, so the scale
 * survives all three.
 *
 * INVARIANT: relative luminance must increase strictly from stop to stop.
 * That is the whole argument for this ramp — break it and the scale stops
 * working in greyscale and for colour-blind readers. A plain hypsometric ramp
 * does NOT satisfy it (map ochre is darker than the gold below it), so these
 * stops are tuned for luminance first and hue second.
 *
 * Kept in sync with the --terrain-* custom properties in globals.css.
 */
const TERRAIN_STOPS: ReadonlyArray<readonly [at: number, hex: string]> = [
  [0, "#10333c"], // Tiefsee
  [25, "#1b5a5b"], // Schelf
  [45, "#3d7350"], // Tiefland
  [62, "#7a8c49"], // Hügel
  [75, "#b0954a"], // Steppe
  [85, "#d0a45e"], // Hochland
  [93, "#e5c48f"], // Grat
  [100, "#f6edda"], // Gipfel
];

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(rgb: readonly number[]): string {
  return (
    "#" +
    rgb
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Rating 0–100 → hex. Hex (not hsl/oklch) because the globe layer needs it. */
export function ratingToColor(rating: number): string {
  const v = Math.max(0, Math.min(100, rating));

  for (let i = 0; i < TERRAIN_STOPS.length - 1; i++) {
    const [aAt, aHex] = TERRAIN_STOPS[i];
    const [bAt, bHex] = TERRAIN_STOPS[i + 1];
    if (v <= bAt) {
      const t = (v - aAt) / (bAt - aAt);
      const a = hexToRgb(aHex);
      const b = hexToRgb(bHex);
      return rgbToHex(a.map((c, k) => c + (b[k] - c) * t));
    }
  }
  return TERRAIN_STOPS[TERRAIN_STOPS.length - 1][1];
}

/**
 * Text colour that stays legible on top of `ratingToColor(rating)`. The ramp
 * spans near-black teal to near-white sand, so a single fixed colour can't
 * work — this picks by relative luminance (WCAG).
 */
export function ratingTextColor(rating: number): string {
  const [r, g, b] = hexToRgb(ratingToColor(rating)).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.42 ? "#0c2028" : "#f2f6f5";
}

/**
 * The band a rating falls into, for labels and legends. Names come from the
 * map, not from a verdict — the point of the scale is that it reads as a
 * collection, not a grade.
 */
export function ratingToBand(rating: number): string {
  if (rating < 20) return "Deep";
  if (rating < 40) return "Shelf";
  if (rating < 60) return "Lowland";
  if (rating < 75) return "Steppe";
  if (rating < 90) return "Highland";
  return "Summit";
}
