/**
 * Customer-driver mix derivation.
 *
 * WHY THIS EXISTS: the reference dashboard mines free review text for purchase
 * drivers. The keyword miner that does exactly that lives in
 * `src/lib/theme-detection.ts`. However, the shipped OLAP cube contains no raw
 * text (see AGENTS.md), so on the live dashboard we derive each brand's driver
 * mix from its REAL aggregate signals instead — average rating, the 1–5★ shape,
 * verified / recommend / response rates and the native-source share.
 *
 * The model is a transparent, deterministic transform: a fixed category prior
 * per driver, modulated by that driver's most relevant real signal. Every input
 * is an observed cube quantity, so the mix (a) differs per brand, (b) reacts to
 * every filter, and (c) is never a hard-coded per-brand number. It is a
 * signal-based proxy, not literal text mining — swap in `detectThemes` counts
 * during cube regeneration to make it verbatim.
 */

import type { Aggregate, Cell, CubePayload, DriverDatum, HeatmapRow } from '@/types'
import { accumulate } from './analytics'
import { clamp } from './format'
import { DRIVER_THEMES } from './theme-detection'

/** Category-typical prior for each driver (canonical order), sums to 1. */
const PRIOR = [0.2, 0.17, 0.13, 0.15, 0.11, 0.09, 0.08, 0.07]

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b)
const dev = (v: number, center: number, span: number) => clamp((v - center) / span, -1, 1)

/**
 * Driver-mix distribution (8 shares summing to 1) for an aggregate.
 * Returns the flat prior for empty aggregates so callers stay well-defined.
 */
export function driverMix(agg: Aggregate): number[] {
  const n = agg.reviews
  if (n === 0) return [...PRIOR]

  const avg = safeDiv(agg.starSum, n)
  const five = safeDiv(agg.stars[4], n)
  const four = safeDiv(agg.stars[3], n)
  const neg = safeDiv(agg.stars[0] + agg.stars[1], n)
  const verifiedRate = safeDiv(agg.verified, n)
  const recommendRate = safeDiv(agg.recommended, n)
  const responseRate = safeDiv(agg.responded, n)
  const nativeShare = safeDiv(agg.sourceCounts[0], n)

  // Each driver is nudged by the real signal it most plausibly reflects.
  const signal = [
    dev(recommendRate, 0.55, 0.35), // Easy Installation ← recommendation strength
    dev(five, 0.55, 0.35), // Appearance / Design ← 5★ concentration
    dev(avg, 4.0, 0.8), // Finish Quality ← rating premium
    dev(verifiedRate, 0.6, 0.35), // Product Quality ← verified strength
    dev(four, 0.22, 0.15), // Value / Price ← mid-high (4★) satisfaction
    dev(0.12 - neg, 0, 0.1), // Durability ← inverse of complaint pressure
    dev(nativeShare, 0.7, 0.3), // Packaging ← first-party fulfilment signal
    dev(responseRate, 0.1, 0.12), // Customer Service ← brand response rate
  ]

  const raw = PRIOR.map((p, i) => p * clamp(1 + 0.45 * signal[i], 0.4, 1.7))
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((r) => r / sum)
}

function aggFor(cells: Cell[], brandIdx: number): Aggregate {
  return accumulate(brandIdx < 0 ? cells : cells.filter((c) => c.b === brandIdx))
}

/** Focus vs. category driver mix, plus the detected-mention base for the donut. */
export function driverOverview(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
): { total: number; drivers: DriverDatum[] } {
  const focusIdx = dict.brands.indexOf(focusBrand)
  const focusAgg = aggFor(scoped, focusIdx)
  const brandMix = driverMix(focusAgg)
  const catMix = driverMix(accumulate(scoped))

  const drivers: DriverDatum[] = DRIVER_THEMES.map((t, i) => ({
    key: t.key,
    label: t.label,
    short: t.short,
    brandShare: brandMix[i],
    categoryShare: catMix[i],
    delta: brandMix[i] - catMix[i],
    index: i,
  }))
  return { total: focusAgg.reviews, drivers }
}

/** Heatmap rows: focus, each competitor, and the category-average baseline. */
export function driverHeatmap(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
  competitorIdxs: number[],
): HeatmapRow[] {
  const focusIdx = dict.brands.indexOf(focusBrand)
  const catMix = driverMix(accumulate(scoped))

  const rowFor = (brandIdx: number): HeatmapRow => {
    const mix = driverMix(aggFor(scoped, brandIdx))
    return {
      brand: dict.brands[brandIdx],
      isFocus: brandIdx === focusIdx,
      isCategory: false,
      cells: DRIVER_THEMES.map((t, i) => ({
        key: t.key,
        value: mix[i],
        delta: mix[i] - catMix[i],
      })),
    }
  }

  const rows: HeatmapRow[] = []
  if (focusIdx >= 0) rows.push(rowFor(focusIdx))
  for (const idx of competitorIdxs) rows.push(rowFor(idx))
  rows.push({
    brand: 'Category Avg',
    isFocus: false,
    isCategory: true,
    cells: DRIVER_THEMES.map((t, i) => ({ key: t.key, value: catMix[i], delta: 0 })),
  })
  return rows
}
