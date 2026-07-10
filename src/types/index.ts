/**
 * Shared domain types for ReviewLens.
 * The analytics layer derives every real metric from the pre-aggregated cube;
 * see `src/lib/analytics.ts`.
 */

import type { DriverKey } from '@/lib/theme-detection'

/** Raw cube payload shipped to the client (pre-aggregated at build time). */
export interface CubePayload {
  meta: {
    total: number
    generated: string
    grain: string[]
  }
  dict: {
    brands: string[]
    subcategories: string[]
    regions: string[]
    sources: string[]
    months: string[]
    retailer: string
    category: string
  }
  schema: string[]
  /** Each cell is a flat numeric tuple keyed by `schema`. */
  cells: number[][]
}

/** A decoded cube cell at the (brand, subcategory, region, month) grain. */
export interface Cell {
  b: number
  s: number
  r: number
  m: number
  n: number
  ss: number
  st: [number, number, number, number, number]
  v: number
  rec: number
  resp: number
  unv: number
  uc: number
  srcN: [number, number, number, number, number]
  srcS: [number, number, number, number, number]
}

/** The five review-source categories, aligned with `srcN` / `srcS` indices. */
export const SOURCE_LABELS = [
  'Native (On-site)',
  'Brand Sites',
  'External Retail',
  'Social / Forums',
  'Other',
] as const

export type BenchmarkMode = 'category-average' | 'market-leaders'

export type TimePreset =
  | 'all'
  | 'l12m'
  | 'l24m'
  | 'l36m'
  | 'ytd'

/** Global filter state. `brand` is the subject ("Brand Focus"). */
export interface Filters {
  brand: string
  subcategories: string[] // empty = all
  regions: string[] // empty = all
  time: TimePreset
  benchmark: BenchmarkMode
}

/** A fully aggregated slice of the cube (a set of accumulated cells). */
export interface Aggregate {
  reviews: number
  starSum: number
  stars: [number, number, number, number, number]
  verified: number
  recommended: number
  responded: number
  unverified: number
  unverifiedComplaints: number
  sourceCounts: [number, number, number, number, number]
  sourceStarSum: [number, number, number, number, number]
}

/** Derived, presentation-ready metrics for an aggregate. */
export interface Metrics {
  reviews: number
  avgRating: number
  nativeShare: number
  verifiedRate: number
  recommendRate: number
  responseRate: number
  unverifiedComplaintRate: number
  externalRatingLift: number
  authenticityScore: number
  /* --- executive-benchmark metrics (all derived from real cube counts) --- */
  /** Share of 1–2★ reviews out of all reviews. */
  negativeRate: number
  /** Reconstructed average rating of verified-purchase reviews. */
  verifiedRating: number
  /** Reconstructed average rating of unverified reviews. */
  unverifiedRating: number
  /** verifiedRating − unverifiedRating. */
  verifiedUnverifiedGap: number
}

export interface BrandRow {
  brand: string
  metrics: Metrics
  isFocus: boolean
}

export interface SourceMixDatum {
  brand: string
  native: number
  brandSites: number
  externalRetail: number
  social: number
  other: number
}

export interface PositioningDatum {
  brand: string
  nativeShare: number
  ratingGap: number
  reviews: number
  isFocus: boolean
}

export interface TrendDatum {
  month: string
  label: string
  reviews: number
  avgRating: number
  verifiedRate: number
}

export interface SourceDetailDatum {
  source: string
  reviews: number
  share: number
  avgRating: number
  index: number
}

/* ------------------------------------------------------------------ */
/*  Executive-benchmark view models                                    */
/* ------------------------------------------------------------------ */

/** One customer-driver theme: focus share vs. category share. */
export interface DriverDatum {
  key: DriverKey
  label: string
  short: string
  brandShare: number
  categoryShare: number
  delta: number
  index: number
}

export interface HeatmapCell {
  key: DriverKey
  value: number
  delta: number
}

export interface HeatmapRow {
  brand: string
  isFocus: boolean
  isCategory: boolean
  cells: HeatmapCell[]
}

/** A row of the competitor-benchmark table. */
export interface CompetitorDatum {
  brand: string
  isFocus: boolean
  reviews: number
  avgRating: number
  verifiedRating: number
  unverifiedRating: number
  recommendRate: number
  negativeRate: number
  status: string
}

/** Period-over-period growth for a cohort. */
export interface Growth {
  /** YoY change in review volume (ratio, e.g. 0.123 = +12.3%). */
  value: number
  recent: number
  prior: number
}

export type InsightTone = 'positive' | 'danger' | 'brand' | 'external' | 'warning'

/** An AI-authored insight card: static copy grounded in a real metric delta. */
export interface AiInsight {
  title: string
  body: string
  /** Real, pre-formatted metric delta shown as a chip (e.g. "+0.24"). */
  metric?: string
  tone: InsightTone
}
