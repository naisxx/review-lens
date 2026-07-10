/**
 * Presentation formatters. Kept free of business logic so they can be reused
 * across cards, tables, charts and tooltips.
 */

const nf = new Intl.NumberFormat('en-US')
const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatInt(value: number): string {
  return nf.format(Math.round(value))
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${nf1.format(value / 1_000_000)}M`
  if (value >= 10_000) return `${nf1.format(value / 1_000)}K`
  return nf.format(Math.round(value))
}

/** `value` is a 0..1 ratio. */
export function formatPercent(value: number, decimals = 1): string {
  const f = decimals === 0 ? nf0 : decimals === 1 ? nf1 : nf2
  return `${f.format(value * 100)}%`
}

export function formatRating(value: number): string {
  return nf2.format(value)
}

/** Signed delta in star-points, e.g. "+0.14" / "-0.23". */
export function formatSignedRating(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${nf2.format(value)}`
}

/** Signed percentage-point delta, e.g. "+2.1 pts". */
export function formatSignedPoints(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${nf1.format(value)}`
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}
