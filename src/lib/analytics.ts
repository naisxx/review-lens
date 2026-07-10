import type {
  Aggregate,
  AuthFactor,
  AuthTrendDatum,
  AuthenticitySignals,
  BenchmarkMode,
  BrandAuthRow,
  BrandRow,
  Cell,
  CompetitorDatum,
  Coverage,
  CubePayload,
  Filters,
  Metrics,
  PositioningDatum,
  SourceDetailDatum,
  SourceMixDatum,
  TrendDatum,
  TrustSegment,
  TrustSegmentKey,
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

/* ------------------------------------------------------------------ */
/*  Authenticity / review-source signals                               */
/* ------------------------------------------------------------------ */

/**
 * Source diversity — normalized Shannon entropy of the 5 review-source channels
 * (0 = every review from one channel, 1 = evenly spread). A review base spread
 * across channels is harder to seed. Documented heuristic.
 */
export function sourceDiversity(agg: Aggregate): number {
  const total = agg.reviews
  if (total === 0) return 0
  let h = 0
  for (const c of agg.sourceCounts) {
    if (c > 0) {
      const p = c / total
      h -= p * Math.log(p)
    }
  }
  return clamp(h / Math.log(agg.sourceCounts.length), 0, 1)
}

/**
 * Sentiment consistency — how closely verified and unverified reviewers agree on
 * negativity (1 = identical 1–2★ rates, 0 = maximally divergent). Large
 * divergence is a classic manipulation flag. Exact from cube counts.
 */
export function sentimentConsistency(agg: Aggregate): number {
  if (agg.verified === 0 || agg.unverified === 0) return 1
  const totalNeg = agg.stars[0] + agg.stars[1]
  const verifiedNeg = Math.max(0, totalNeg - agg.unverifiedComplaints)
  const vRate = verifiedNeg / agg.verified
  const uRate = agg.unverifiedComplaints / agg.unverified
  return clamp(1 - Math.abs(vRate - uRate), 0, 1)
}

/**
 * Distribution health — share of "middle" ratings (2–4★). Genuine review sets
 * keep a meaningful middle; an all-1★/5★ (empty-middle) shape is a seeding /
 * brigading flag. Reaches 1 at ≥22% middle. Documented heuristic.
 */
export function distributionHealth(agg: Aggregate): number {
  if (agg.reviews === 0) return 0
  const middle = agg.stars[1] + agg.stars[2] + agg.stars[3]
  return clamp(middle / agg.reviews / 0.22, 0, 1)
}

const TRUST_SEGMENTS: { key: TrustSegmentKey; label: string }[] = [
  { key: 'verifiedAdvocates', label: 'Verified Advocates' },
  { key: 'verifiedCritics', label: 'Verified Critics' },
  { key: 'unverifiedVoices', label: 'Unverified Voices' },
  { key: 'unverifiedComplaints', label: 'Unverified Complaints' },
]

/**
 * Reviewer Trust Mix — an EXACT 4-way partition of all reviews by
 * verification × sentiment (no reconstruction):
 *   Verified Critics     = verified 1–2★ = (st1+st2) − uc
 *   Unverified Complaints = uc
 *   Verified Advocates    = verified non-negative = v − verifiedCritics
 *   Unverified Voices     = unverified non-negative = unv − uc
 */
export function reviewerTrustMix(agg: Aggregate): TrustSegment[] {
  const totalNeg = agg.stars[0] + agg.stars[1]
  const verifiedCritics = Math.max(0, totalNeg - agg.unverifiedComplaints)
  const unverifiedComplaints = agg.unverifiedComplaints
  const verifiedAdvocates = Math.max(0, agg.verified - verifiedCritics)
  const unverifiedVoices = Math.max(0, agg.unverified - unverifiedComplaints)
  const counts = [verifiedAdvocates, verifiedCritics, unverifiedVoices, unverifiedComplaints]
  const total = counts.reduce((a, b) => a + b, 0) || 1
  return TRUST_SEGMENTS.map((s, i) => ({
    key: s.key,
    label: s.label,
    count: counts[i],
    share: counts[i] / total,
    index: i,
  }))
}

/** Bundled authenticity signals for an aggregate. */
export function authenticitySignals(agg: Aggregate): AuthenticitySignals {
  const m = deriveMetrics(agg)
  return {
    reviews: agg.reviews,
    avgRating: m.avgRating,
    authenticityScore: m.authenticityScore,
    verifiedRate: m.verifiedRate,
    firstPartyShare: m.nativeShare,
    sourceDiversity: sourceDiversity(agg),
    sentimentConsistency: sentimentConsistency(agg),
    complaintContainment: 1 - m.unverifiedComplaintRate,
    distributionHealth: distributionHealth(agg),
    unverifiedShare: safeDiv(agg.unverified, agg.reviews),
    recommendRate: m.recommendRate,
    responseRate: m.responseRate,
  }
}

const AUTH_FACTOR_DEFS: {
  key: string
  label: string
  get: (s: AuthenticitySignals) => number
  heuristic?: boolean
}[] = [
  { key: 'verified', label: 'Verified Purchase Rate', get: (s) => s.verifiedRate },
  { key: 'firstParty', label: 'First-Party (Native) Share', get: (s) => s.firstPartyShare },
  { key: 'consistency', label: 'Sentiment Consistency', get: (s) => s.sentimentConsistency },
  { key: 'containment', label: 'Complaint Containment', get: (s) => s.complaintContainment },
  { key: 'recommend', label: 'Recommendation Rate', get: (s) => s.recommendRate },
  { key: 'health', label: 'Distribution Health', get: (s) => s.distributionHealth, heuristic: true },
]

/** Authenticity Breakdown rows: focus factor value vs. category. */
export function authenticityFactors(
  focus: AuthenticitySignals,
  category: AuthenticitySignals,
): AuthFactor[] {
  return AUTH_FACTOR_DEFS.map((d) => {
    const value = d.get(focus)
    const categoryValue = d.get(category)
    return {
      key: d.key,
      label: d.label,
      value,
      categoryValue,
      delta: value - categoryValue,
      heuristic: d.heuristic,
    }
  })
}

/** Monthly authenticity score for the focus brand vs. category (chronological). */
export function authenticityTrend(
  scoped: Cell[],
  dict: CubePayload['dict'],
  brandIdx: number,
): AuthTrendDatum[] {
  const brandByMonth = new Map<number, Aggregate>()
  const catByMonth = new Map<number, Aggregate>()
  const add = (map: Map<number, Aggregate>, c: Cell) => {
    let a = map.get(c.m)
    if (!a) {
      a = accumulate([])
      map.set(c.m, a)
    }
    addCell(a, c)
  }
  for (const c of scoped) {
    add(catByMonth, c)
    if (c.b === brandIdx) add(brandByMonth, c)
  }
  return [...catByMonth.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([m, catAgg]) => {
      const brandAgg = brandByMonth.get(m)
      const mk = dict.months[m]
      return {
        month: mk,
        label: formatMonth(mk),
        brandScore: brandAgg ? deriveMetrics(brandAgg).authenticityScore : 0,
        categoryScore: deriveMetrics(catAgg).authenticityScore,
      }
    })
}

/** Per-brand authenticity rows for the top brands plus the focus brand. */
export function brandAuthRows(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
  limit: number,
): BrandAuthRow[] {
  const focusIdx = dict.brands.indexOf(focusBrand)
  const ranked = rankBrandsByVolume(scoped)
  const chosen = new Set(ranked.slice(0, limit))
  if (focusIdx >= 0) chosen.add(focusIdx)
  const rows: BrandAuthRow[] = [...chosen].map((idx) => {
    const s = authenticitySignals(accumulate(scoped.filter((c) => c.b === idx)))
    return {
      brand: dict.brands[idx],
      isFocus: idx === focusIdx,
      score: s.authenticityScore,
      verifiedRate: s.verifiedRate,
      firstPartyShare: s.firstPartyShare,
      sentimentConsistency: s.sentimentConsistency,
      complaintRate: 1 - s.complaintContainment,
      avgRating: s.avgRating,
    }
  })
  rows.sort((a, b) => b.score - a.score)
  return rows
}

/** Review-evidence breadth for the focus brand within scope. */
export function coverage(
  scoped: Cell[],
  dict: CubePayload['dict'],
  brandIdx: number,
): Coverage {
  const subs = new Set<number>()
  const regs = new Set<number>()
  let reviews = 0
  for (const c of scoped) {
    if (c.b !== brandIdx) continue
    reviews += c.n
    subs.add(c.s)
    regs.add(c.r)
  }
  return {
    reviews,
    perSubcategory: subs.size > 0 ? reviews / subs.size : 0,
    subcatsCovered: subs.size,
    totalSubcats: dict.subcategories.length,
    regionsCovered: regs.size,
    totalRegions: dict.regions.length,
  }
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
