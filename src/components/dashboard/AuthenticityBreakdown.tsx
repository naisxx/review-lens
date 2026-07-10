import type { AuthenticityResult } from '@/hooks/useAuthenticity'
import type { DrillAction } from '@/components/ui/info-dot'
import { formatPercent, formatSignedPoints, formatInt } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SectionCard } from './SectionCard'

function deltaColor(delta: number): string {
  if (delta > 0.005) return 'text-positive'
  if (delta < -0.005) return 'text-danger'
  return 'text-ink-muted'
}

/** Decomposes the composite authenticity score into six real, auditable factors. */
export function AuthenticityBreakdown({
  analytics,
  drill,
}: {
  analytics: AuthenticityResult
  drill?: DrillAction
}) {
  const { factors, focus, category, filters } = analytics

  return (
    <SectionCard
      title="Review Authenticity Breakdown"
      info="Each factor is derived directly from cube counts. Bars show the focus brand; the tick marks the category average. Distribution Health is a documented heuristic, not a certified fraud score."
      className="h-full"
      drill={drill}
      actions={
        <span className="text-[10.5px] font-medium text-ink-faint">
          {filters.brand} vs Category Avg
        </span>
      }
      bodyClassName="flex flex-col p-3"
    >
      <table className="h-full w-full text-[12px]">
        <thead>
          <tr className="text-[9.5px] uppercase tracking-wide text-ink-faint">
            <th className="pb-1.5 pr-2 text-left font-semibold">Factor</th>
            <th className="px-2 pb-1.5 text-right font-semibold">Score</th>
            <th className="w-[38%] px-2 pb-1.5 text-left font-semibold">vs Category Avg</th>
            <th className="pb-1.5 pl-2 text-right font-semibold">Δ</th>
          </tr>
        </thead>
        <tbody>
          {factors.map((f) => (
            <tr key={f.key} className="border-t border-line/50">
              <td className="py-[7px] pr-2">
                <span className="flex items-center gap-1.5 text-ink">
                  {f.label}
                  {f.heuristic && (
                    <span className="rounded bg-surface-3 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-ink-faint ring-1 ring-inset ring-line-strong">
                      est
                    </span>
                  )}
                </span>
              </td>
              <td className="px-2 py-[7px] text-right tabular font-semibold text-ink">
                {formatPercent(f.value, 1)}
              </td>
              <td className="px-2 py-[7px]">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      f.delta >= 0 ? 'bg-positive' : 'bg-danger/80',
                    )}
                    style={{ width: `${Math.max(2, f.value * 100)}%` }}
                  />
                  {/* category-average tick */}
                  <span
                    className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink-muted"
                    style={{ left: `${f.categoryValue * 100}%` }}
                  />
                </div>
              </td>
              <td
                className={cn('py-[7px] pl-2 text-right tabular font-medium', deltaColor(f.delta))}
              >
                {formatSignedPoints(f.delta * 100)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-line-strong">
            <td className="pt-2.5 pr-2 text-[12px] font-semibold text-positive">
              Overall Authenticity Score
            </td>
            <td className="px-2 pt-2.5 text-right tabular font-semibold text-ink">
              {formatInt(focus.authenticityScore)}
              <span className="text-ink-faint"> / 100</span>
            </td>
            <td className="px-2 pt-2.5" />
            <td className="pt-2.5 pl-2 text-right tabular font-medium text-positive">
              {formatSignedPoints(focus.authenticityScore - category.authenticityScore)}
            </td>
          </tr>
        </tbody>
      </table>
    </SectionCard>
  )
}
