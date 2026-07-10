import type {
  Aggregate,
  BenchmarkMode,
  BrandRow,
  Cell,
  CompetitorDatum,
  CubePayload,
  Filters,
  Metrics,
  PositioningDatum,
  SourceDetailDatum,
  SourceMixDatum,
  TrendDatum,
} from '@/types'
import { clamp } from './format'

/* ------------------------------------------------------------------ */
/*  Decoding                                                           */
/* ------------------------------------------------------------------ */

/** Decode the flat numeric cube into structured cells (done once). */
export function decodeCells(payload: CubePayload): Cell[] {
  return payload.cells.map((c) => ({
    b: c[0],
    s: c[1],
    r: c[2],
    m: c[3],
    n: c[4],
    ss: c[5],
    st: [c[6], c[7], c[8], c[9], c[10]],
    v: c[11],
    rec: c[12],
    resp: c[13],
    unv: c[14],
    uc: c[15],
    srcN: [c[16], c[17], c[18], c[19], c[20]],
    srcS: [c[21], c[22], c[23], c[24], c[25]],
  }))
}

/* ------------------------------------------------------------------ */
/*  Aggregation                                                        */
/* ------------------------------------------------------------------ */

function emptyAggregate(): Aggregate {
  return {
    reviews: 0,
    starSum: 0,
    stars: [0, 0, 0, 0, 0],
    verified: 0,
    recommended: 0,
    responded: 0,
    unverified: 0,
    unverifiedComplaints: 0,
    sourceCounts: [0, 0, 0, 0, 0],
    sourceStarSum: [0, 0, 0, 0, 0],
  }
}

function addCell(agg: Aggregate, c: Cell): void {
  agg.reviews += c.n
  agg.starSum += c.ss
  agg.verified += c.v
  agg.recommended += c.rec
  agg.responded += c.resp
  agg.unverified += c.unv
  agg.unverifiedComplaints += c.uc
  for (let i = 0; i < 5; i++) {
    agg.stars[i] += c.st[i]
    agg.sourceCounts[i] += c.srcN[i]
    agg.sourceStarSum[i] += c.srcS[i]
  }
}

export function accumulate(cells: Cell[]): Aggregate {
  const agg = emptyAggregate()
  for (const c of cells) addCell(agg, c)
  return agg
}

/* ------------------------------------------------------------------ */
/*  Metric derivation                                                  */
/* ------------------------------------------------------------------ */

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b)

/**
 * Composite authenticity score (0-100), derived purely from observed signals.
 * Weights are documented so the number is auditable rather than magical.
 */
function authenticityScore(m: Omit<Metrics, 'authenticityScore'>): number {
  const stability = 1 - clamp(Math.abs(m.externalRatingLift) / 2)
  const score =
    0.34 * m.nativeShare +
    0.3 * m.verifiedRate +
    0.16 * (1 - m.unverifiedComplaintRate) +
    0.1 * clamp(m.avgRating / 5) +
    0.1 * stability
  return Math.round(score * 100)
}

/**
 * Reconstruct the average rating of the verified and unverified cohorts using
 * ONLY real cube quantities. The cube stores, per cell, the full 1–5★ histogram,
 * verified/unverified counts, and the count of 1–2★ reviews among unverified
 * reviewers (`uc`). From these:
 *
 *   • total negatives (1–2★) and total positives (3–5★) are known exactly;
 *   • unverified negatives = `uc` (real) ⇒ verified negatives = total − `uc` (real);
 *
 * so each cohort's negative count is real. We value negatives at the observed
 * mean negative star and positives at the observed mean positive star. The only
 * assumption is that the *within-negative* and *within-positive* star shapes are
 * shared across cohorts — the cohorts still differ because their negative rates
 * differ (a real, observed difference). By construction the two cohort averages
 * recombine exactly to the overall average.
 */
function cohortRatings(agg: Aggregate): {
  verifiedRating: number
  unverifiedRating: number
} {
  const overall = safeDiv(agg.starSum, agg.reviews)
  const negatives = agg.stars[0] + agg.stars[1]
  const positives = agg.reviews - negatives
  const negMeanStar = safeDiv(agg.stars[0] * 1 + agg.stars[1] * 2, negatives)
  const posMeanStar = safeDiv(
    agg.stars[2] * 3 + agg.stars[3] * 4 + agg.stars[4] * 5,
    positives,
  )

  const negUnv = Math.min(agg.unverifiedComplaints, negatives)
  const negVer = Math.max(0, negatives - negUnv)
  const posVer = Math.max(0, agg.verified - negVer)
  const posUnv = Math.max(0, agg.unverified - negUnv)

  const verifiedRating =
    agg.verified > 0
      ? safeDiv(negVer * negMeanStar + posVer * posMeanStar, agg.verified)
      : overall
  const unverifiedRating =
    agg.unverified > 0
      ? safeDiv(negUnv * negMeanStar + posUnv * posMeanStar, agg.unverified)
      : overall

  return { verifiedRating, unverifiedRating }
}

export function deriveMetrics(agg: Aggregate): Metrics {
  const nativeCount = agg.sourceCounts[0]
  const externalCount = agg.reviews - nativeCount
  const externalStarSum = agg.starSum - agg.sourceStarSum[0]
  const nativeAvg = safeDiv(agg.sourceStarSum[0], nativeCount)
  const externalAvg = safeDiv(externalStarSum, externalCount)
  const { verifiedRating, unverifiedRating } = cohortRatings(agg)

  const base = {
    reviews: agg.reviews,
    avgRating: safeDiv(agg.starSum, agg.reviews),
    nativeShare: safeDiv(nativeCount, agg.reviews),
    verifiedRate: safeDiv(agg.verified, agg.reviews),
    recommendRate: safeDiv(agg.recommended, agg.reviews),
    responseRate: safeDiv(agg.responded, agg.reviews),
    unverifiedComplaintRate: safeDiv(agg.unverifiedComplaints, agg.unverified),
    // Positive = external sources rate higher than native (lift); negative = drag.
    externalRatingLift: externalCount === 0 ? 0 : externalAvg - nativeAvg,
    negativeRate: safeDiv(agg.stars[0] + agg.stars[1], agg.reviews),
    verifiedRating,
    unverifiedRating,
    verifiedUnverifiedGap: verifiedRating - unverifiedRating,
  }
  return { ...base, authenticityScore: authenticityScore(base) }
}

/* ------------------------------------------------------------------ */
/*  Scope filtering                                                    */
/* ------------------------------------------------------------------ */

/** Resolve a time preset to the set of allowed month indices. */
function allowedMonths(months: string[], time: Filters['time']): Set<number> | null {
  if (time === 'all') return null
  const anchor = months[months.length - 1] // latest month present in data
  if (time === 'ytd') {
    const year = anchor.slice(0, 4)
    const set = new Set<number>()
    months.forEach((mk, i) => {
      if (mk.startsWith(year)) set.add(i)
    })
    return set
  }
  const back = time === 'l12m' ? 12 : time === 'l24m' ? 24 : 36
  const start = Math.max(0, months.length - back)
  const set = new Set<number>()
  for (let i = start; i < months.length; i++) set.add(i)
  return set
}

export interface ScopeContext {
  cells: Cell[]
  dict: CubePayload['dict']
}

/**
 * Cells matching the *universe* filters (subcategory / region / time).
 * Brand focus is applied separately so brand-vs-peer comparisons stay valid.
 */
export function scopeCells(ctx: ScopeContext, filters: Filters): Cell[] {
  const { dict } = ctx
  const subSet =
    filters.subcategories.length === 0
      ? null
      : new Set(filters.subcategories.map((s) => dict.subcategories.indexOf(s)))
  const regSet =
    filters.regions.length === 0
      ? null
      : new Set(filters.regions.map((r) => dict.regions.indexOf(r)))
  const months = allowedMonths(dict.months, filters.time)

  return ctx.cells.filter(
    (c) =>
      (subSet === null || subSet.has(c.s)) &&
      (regSet === null || regSet.has(c.r)) &&
      (months === null || months.has(c.m)),
  )
}

/* ------------------------------------------------------------------ */
/*  Selectors — each returns presentation-ready data                   */
/* ------------------------------------------------------------------ */

export function metricsForBrand(scoped: Cell[], brandIdx: number): Metrics {
  return deriveMetrics(accumulate(scoped.filter((c) => c.b === brandIdx)))
}

export function universeMetrics(scoped: Cell[]): Metrics {
  return deriveMetrics(accumulate(scoped))
}

/** Brands ordered by review volume within the current scope. */
export function rankBrandsByVolume(scoped: Cell[]): number[] {
  const vol = new Map<number, number>()
  for (const c of scoped) vol.set(c.b, (vol.get(c.b) ?? 0) + c.n)
  return [...vol.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b)
}

/** Benchmark aggregate baseline used for comparison deltas. */
export function benchmarkMetrics(scoped: Cell[], mode: BenchmarkMode): Metrics {
  if (mode === 'category-average') return universeMetrics(scoped)
  const leaders = new Set(rankBrandsByVolume(scoped).slice(0, 5))
  return deriveMetrics(accumulate(scoped.filter((c) => leaders.has(c.b))))
}

/** Per-brand table rows for the top `limit` brands plus the focus brand. */
export function brandRows(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
  limit: number,
): BrandRow[] {
  const focusIdx = dict.brands.indexOf(focusBrand)
  const ranked = rankBrandsByVolume(scoped)
  const chosen = new Set(ranked.slice(0, limit))
  if (focusIdx >= 0) chosen.add(focusIdx)

  const rows: BrandRow[] = [...chosen].map((idx) => ({
    brand: dict.brands[idx],
    metrics: metricsForBrand(scoped, idx),
    isFocus: idx === focusIdx,
  }))
  rows.sort((a, b) => b.metrics.authenticityScore - a.metrics.authenticityScore)
  return rows
}

export function sourceMix(
  scoped: Cell[],
  dict: CubePayload['dict'],
  limit: number,
): SourceMixDatum[] {
  const ranked = rankBrandsByVolume(scoped).slice(0, limit)
  return ranked.map((idx) => {
    const agg = accumulate(scoped.filter((c) => c.b === idx))
    const total = agg.reviews || 1
    return {
      brand: dict.brands[idx],
      native: agg.sourceCounts[0] / total,
      brandSites: agg.sourceCounts[1] / total,
      externalRetail: agg.sourceCounts[2] / total,
      social: agg.sourceCounts[3] / total,
      other: agg.sourceCounts[4] / total,
    }
  })
}

export function positioning(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
  limit: number,
): PositioningDatum[] {
  const focusIdx = dict.brands.indexOf(focusBrand)
  const categoryAvg = universeMetrics(scoped).avgRating
  const ranked = rankBrandsByVolume(scoped)
  const chosen = new Set(ranked.slice(0, limit))
  if (focusIdx >= 0) chosen.add(focusIdx)
  return [...chosen].map((idx) => {
    const m = metricsForBrand(scoped, idx)
    return {
      brand: dict.brands[idx],
      nativeShare: m.nativeShare,
      ratingGap: m.avgRating - categoryAvg,
      reviews: m.reviews,
      isFocus: idx === focusIdx,
    }
  })
}

export function sourceDetail(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
): SourceDetailDatum[] {
  const idx = dict.brands.indexOf(focusBrand)
  const agg = accumulate(idx >= 0 ? scoped.filter((c) => c.b === idx) : scoped)
  const total = agg.reviews || 1
  return dict.sources.map((source, i) => ({
    source,
    reviews: agg.sourceCounts[i],
    share: agg.sourceCounts[i] / total,
    avgRating: safeDiv(agg.sourceStarSum[i], agg.sourceCounts[i]),
    index: i,
  }))
}

/** Monthly trend for the focus brand within scope (chronological). */
export function trend(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
): TrendDatum[] {
  const idx = dict.brands.indexOf(focusBrand)
  const cells = idx >= 0 ? scoped.filter((c) => c.b === idx) : scoped
  const byMonth = new Map<number, Aggregate>()
  for (const c of cells) {
    let agg = byMonth.get(c.m)
    if (!agg) {
      agg = accumulate([])
      byMonth.set(c.m, agg)
    }
    addCell(agg, c)
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([m, agg]) => {
      const mk = dict.months[m]
      return {
        month: mk,
        label: formatMonth(mk),
        reviews: agg.reviews,
        avgRating: safeDiv(agg.starSum, agg.reviews),
        verifiedRate: safeDiv(agg.verified, agg.reviews),
      }
    })
}

function formatMonth(mk: string): string {
  const [y, m] = mk.split('-')
  const names = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${names[Number(m) - 1]} ${y.slice(2)}`
}

/* ------------------------------------------------------------------ */
/*  Executive-benchmark selectors                                      */
/* ------------------------------------------------------------------ */

const monthOrdinal = (mk: string): number => {
  const [y, m] = mk.split('-')
  return Number(y) * 12 + (Number(m) - 1)
}

/**
 * Year-over-year review-volume growth for an already-filtered set of cells.
 * Compares the most recent 12 calendar months of data to the prior 12, anchored
 * on the latest month present in the supplied cells. Returns a ratio (0.12 =
 * +12%); `prior === 0` yields 0 to avoid divide-by-zero blowups.
 */
export function growthYoY(
  cells: Cell[],
  months: string[],
): { value: number; recent: number; prior: number } {
  if (cells.length === 0) return { value: 0, recent: 0, prior: 0 }
  const byMonth = new Map<number, number>() // ordinal -> reviews
  let anchor = -Infinity
  for (const c of cells) {
    const ord = monthOrdinal(months[c.m])
    byMonth.set(ord, (byMonth.get(ord) ?? 0) + c.n)
    if (ord > anchor) anchor = ord
  }
  let recent = 0
  let prior = 0
  for (const [ord, n] of byMonth) {
    if (ord > anchor - 12 && ord <= anchor) recent += n
    else if (ord > anchor - 24 && ord <= anchor - 12) prior += n
  }
  return { value: prior === 0 ? 0 : recent / prior - 1, recent, prior }
}

/** Focus brand's share of all reviews in the current scope (0..1). */
export function shareOfCategory(scoped: Cell[], brandIdx: number): number {
  let brand = 0
  let total = 0
  for (const c of scoped) {
    total += c.n
    if (c.b === brandIdx) brand += c.n
  }
  return safeDiv(brand, total)
}

/**
 * The top competitor brands by review volume, excluding the focus brand.
 * Returns brand indices (highest volume first).
 */
export function competitorIdxs(
  scoped: Cell[],
  focusIdx: number,
  count: number,
): number[] {
  return rankBrandsByVolume(scoped)
    .filter((idx) => idx !== focusIdx)
    .slice(0, count)
}

function competitorStatus(m: Metrics, category: Metrics): string {
  const ratingUp = m.avgRating >= category.avgRating
  const negWorse = m.negativeRate > category.negativeRate
  const verifiedUp = m.verifiedRating >= category.avgRating
  if (ratingUp && verifiedUp && !negWorse) return 'Leads peers on rating & verified reviews'
  if (ratingUp && negWorse) return 'Strong rating, elevated complaint risk'
  if (!ratingUp && !negWorse) return 'Steady satisfaction, mid-tier rating'
  if (verifiedUp && !ratingUp) return 'Strong verified base, softer overall rating'
  return 'Below category on complaint risk'
}

/** Focus + top competitors as fully-derived benchmark rows (focus first). */
export function competitorRows(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
  competitorCount: number,
): CompetitorDatum[] {
  const focusIdx = dict.brands.indexOf(focusBrand)
  const category = universeMetrics(scoped)
  const idxs = [focusIdx, ...competitorIdxs(scoped, focusIdx, competitorCount)].filter(
    (i) => i >= 0,
  )
  return idxs.map((idx) => {
    const m = metricsForBrand(scoped, idx)
    return {
      brand: dict.brands[idx],
      isFocus: idx === focusIdx,
      reviews: m.reviews,
      avgRating: m.avgRating,
      verifiedRating: m.verifiedRating,
      unverifiedRating: m.unverifiedRating,
      recommendRate: m.recommendRate,
      negativeRate: m.negativeRate,
      status: competitorStatus(m, category),
    }
  })
}

/** Average metrics across the top competitor peers (peer benchmark baseline). */
export function peerMetrics(
  scoped: Cell[],
  focusIdx: number,
  competitorCount: number,
): Metrics {
  const idxs = new Set(competitorIdxs(scoped, focusIdx, competitorCount))
  return deriveMetrics(accumulate(scoped.filter((c) => idxs.has(c.b))))
}

/** Human-readable label for the active time window. */
export function timeWindowLabel(dict: CubePayload['dict'], time: Filters['time']): string {
  const set = allowedMonths(dict.months, time)
  if (set === null) {
    return `${formatMonth(dict.months[0])} – ${formatMonth(dict.months[dict.months.length - 1])}`
  }
  const idxs = [...set].sort((a, b) => a - b)
  return `${formatMonth(dict.months[idxs[0]])} – ${formatMonth(dict.months[idxs[idxs.length - 1]])}`
}
