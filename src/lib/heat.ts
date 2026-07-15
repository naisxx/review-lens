/**
 * Shared diverging heat scale used by BOTH the Customer Driver Heatmap and the
 * Competitor Benchmark table (and their legends), so a colour means the same
 * thing everywhere: red = below / worse than category, amber = near, green =
 * above / better.
 *
 * Colours are pre-blended over the card surface and returned as OPAQUE `rgb()`
 * strings. That is the key to legend↔cell matching: a legend swatch and a table
 * cell built from the same input render as byte-identical colours (no alpha, so
 * nothing behind them can shift the result).
 */

const SURFACE = [16, 20, 28] // --color-surface  #10141c
// Vibrant two-hue diverging scale through a neutral slate centre. The endpoints
// are the dashboard's own green/red so the heatmap stays on-brand; dropping the
// amber midpoint keeps it lively without the traffic-light glare.
const GREEN = [75, 180, 124] // --color-positive — above / better
const RED = [221, 96, 112] // --color-danger  — below / worse
const SLATE = [120, 132, 155] // near average (neutral)

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => lerp(v, b[i], t))

/**
 * Map a normalized signal `norm ∈ [-1, 1]` to a tint.
 * -1 → red, 0 → neutral slate, +1 → green. Magnitude drives intensity (a soft
 * neutral near the centre, saturated colour at the extremes) so differences pop
 * without the whole grid flashing.
 */
export function heatColor(norm: number): string {
  const n = clamp(norm, -1, 1)
  const base = n < 0 ? mix(SLATE, RED, -n) : mix(SLATE, GREEN, n)
  const alpha = 0.24 + 0.54 * Math.abs(n)
  const [r, g, b] = base.map((c, i) => Math.round(lerp(SURFACE[i], c, alpha)))
  return `rgb(${r}, ${g}, ${b})`
}

/** Legend swatches spanning the full scale (red → amber → green), 11 steps. */
export const HEAT_LEGEND: string[] = Array.from({ length: 11 }, (_, i) =>
  heatColor(-1 + i / 5),
)

/** Signed, clamped normalization helper: (value − ref) / span, sign-flipped when lower is better. */
export function heatNorm(
  value: number,
  ref: number,
  span: number,
  higherIsBetter = true,
): number {
  const raw = (value - ref) / span
  return clamp(higherIsBetter ? raw : -raw, -1, 1)
}

/* ------------------------------------------------------------------ */
/*  Vivid magnitude scale (red → orange → amber → green)               */
/* ------------------------------------------------------------------ */

// A punchy RdYlGn ramp keyed to a value's magnitude (low = red, high = green),
// for grids where the cell size itself is the story (e.g. brand × reason share).
// Use DARK text on these cells — they're bright by design.
const VALUE_RAMP = [
  [206, 74, 84], // 0.00 red
  [216, 126, 60], // 0.25 orange
  [214, 182, 76], // 0.50 amber / yellow
  [140, 190, 84], // 0.75 yellow-green
  [70, 176, 112], // 1.00 green
]

/** Map `t ∈ [0,1]` to a vivid RdYlGn colour (opaque, lightly seated on surface). */
export function valueHeat(t: number): string {
  const n = clamp(t, 0, 1) * (VALUE_RAMP.length - 1)
  const i = Math.floor(n)
  const f = n - i
  const a = VALUE_RAMP[i]
  const b = VALUE_RAMP[Math.min(i + 1, VALUE_RAMP.length - 1)]
  const [r, g, bl] = a.map((c, k) => Math.round(lerp(SURFACE[k], lerp(c, b[k], f), 0.92)))
  return `rgb(${r}, ${g}, ${bl})`
}

/** Legend swatches for the vivid value scale (low → high), 11 steps. */
export const VALUE_LEGEND: string[] = Array.from({ length: 11 }, (_, i) => valueHeat(i / 10))
