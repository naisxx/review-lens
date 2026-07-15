import type { AnalyticsResult } from '@/hooks/useAnalytics'
import type { CompetitorDatum, Metrics } from '@/types'
import { formatCompact, formatPercent, formatRating } from '@/lib/format'
import { heatColor, heatNorm, HEAT_LEGEND } from '@/lib/heat'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/ui/brand-logo'
import { SectionCard } from './SectionCard'

interface MetricCol {
  key: 'avgRating' | 'verifiedRating' | 'unverifiedRating' | 'recommendRate' | 'negativeRate'
  label: string
  ref: (m: Metrics) => number
  span: number
  higherIsBetter: boolean
  fmt: (v: number) => string
}

const METRIC_COLS = (cat: Metrics): MetricCol[] => [
  { key: 'avgRating', label: 'Avg Rating', ref: () => cat.avgRating, span: 0.15, higherIsBetter: true, fmt: (v) => `${formatRating(v)}★` },
  { key: 'verifiedRating', label: 'Verified', ref: () => cat.verifiedRating, span: 0.15, higherIsBetter: true, fmt: (v) => `${formatRating(v)}★` },
  { key: 'unverifiedRating', label: 'Unverified', ref: () => cat.unverifiedRating, span: 0.15, higherIsBetter: true, fmt: (v) => `${formatRating(v)}★` },
  { key: 'recommendRate', label: 'Recommend', ref: () => cat.recommendRate, span: 0.05, higherIsBetter: true, fmt: (v) => formatPercent(v, 0) },
  { key: 'negativeRate', label: 'Neg. Rate', ref: () => cat.negativeRate, span: 0.02, higherIsBetter: false, fmt: (v) => formatPercent(v, 1) },
]

export function CompetitorBenchmarkTable({
  analytics,
  drill,
}: {
  analytics: AnalyticsResult
  drill?: import('@/components/ui/info-dot').DrillAction
}) {
  const { competitors, category, filters, competitorNames } = analytics
  const cols = METRIC_COLS(category)

  const list =
    competitorNames.length > 0
      ? competitorNames.length <= 3
        ? competitorNames.join(', ')
        : `${competitorNames.length} peers`
      : 'peers'

  const metricCell = (row: CompetitorDatum, c: MetricCol) => {
    const value = row[c.key]
    const norm = heatNorm(value, c.ref(category), c.span, c.higherIsBetter)
    return (
      <td key={c.key} className="px-1 py-1 text-center">
        <div
          className="rounded-[4px] px-2 py-1.5 tabular text-[12.5px] font-semibold text-ink"
          style={{ backgroundColor: heatColor(norm) }}
        >
          {c.fmt(value)}
        </div>
      </td>
    )
  }

  return (
    <SectionCard
      title={`Competitor Benchmark — ${filters.brand} vs ${list}`}
      info="Focus brand and top competitors across the executive metrics, rendered as a heatmap: each metric cell is tinted green (better than category), amber (near) or red (worse) on the shared scale. All values are live from the corpus."
      className="h-full"
      drill={drill}
      bodyClassName="flex flex-col p-3"
    >
      <div className="flex-1 overflow-x-auto">
        <table className="w-full border-separate border-spacing-x-[3px] border-spacing-y-[3px] text-[12.5px]">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              <th className="px-2 py-1 text-left">Brand</th>
              <th className="px-2 py-1 text-right">Reviews</th>
              {cols.map((c) => (
                <th key={c.key} className="px-1 py-1 text-center">
                  {c.label}
                </th>
              ))}
              <th className="px-2 py-1 text-left">Status vs Category</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((row) => (
              <tr key={row.brand} className="align-middle">
                <td
                  className={cn(
                    'whitespace-nowrap px-2 py-1 font-medium',
                    row.isFocus
                      ? 'border-l-2 border-brand pl-1.5 text-brand'
                      : 'text-ink',
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <BrandLogo name={row.brand} />
                    {row.brand}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-1 text-right tabular text-ink-muted">
                  {formatCompact(row.reviews)}
                </td>
                {cols.map((c) => metricCell(row, c))}
                <td className="whitespace-nowrap px-2 py-1 text-[11.5px] text-ink-muted">
                  {row.status}
                </td>
              </tr>
            ))}
            {/* Category baseline — untinted reference row */}
            <tr className="align-middle">
              <td className="whitespace-nowrap px-2 pt-2 text-[12px] font-semibold italic text-ink-muted">
                Category Avg
              </td>
              <td className="px-2 pt-2 text-right tabular text-ink-muted">
                {formatCompact(category.reviews)}
              </td>
              {cols.map((c) => (
                <td key={c.key} className="px-1 pt-2 text-center tabular text-ink-muted">
                  {c.fmt(c.ref(category))}
                </td>
              ))}
              <td className="px-2 pt-2 text-[11px] italic text-ink-faint">Reference baseline</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Shared heat legend */}
      <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[9.5px] text-ink-faint">
        <span className="shrink-0">Below Category Avg</span>
        <div className="flex items-center gap-[3px]">
          {HEAT_LEGEND.map((c, i) => (
            <span key={i} className="h-[11px] w-[11px] rounded-[2px]" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span className="shrink-0">Above Category Avg</span>
      </div>
    </SectionCard>
  )
}
