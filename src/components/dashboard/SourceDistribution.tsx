import type { AuthenticityResult } from '@/hooks/useAuthenticity'
import type { DrillAction } from '@/components/ui/info-dot'
import { SOURCE_COLORS } from '@/components/charts/chart-theme'
import { formatInt, formatPercent, formatRating } from '@/lib/format'
import { SectionCard } from './SectionCard'

/** Where the focus brand's reviews originate + the rating each source contributes. */
export function SourceDistribution({
  analytics,
  drill,
}: {
  analytics: AuthenticityResult
  drill?: DrillAction
}) {
  const { sources, filters } = analytics
  const active = sources.filter((s) => s.reviews > 0)
  const max = Math.max(...active.map((s) => s.share), 0.0001)

  return (
    <SectionCard
      title="Review Source Distribution"
      info="Share of the focus brand's reviews by source channel, with the average star rating each channel contributes. First-party (native) reviews are the least manipulable."
      className="h-full"
      drill={drill}
      actions={<span className="text-[10.5px] font-medium text-ink-faint">{filters.brand}</span>}
      bodyClassName="p-3"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-faint">
          <span>Source</span>
          <span>% of reviews · avg★</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-evenly py-1">
          {active.map((s) => (
            <div key={s.source} className="flex items-center gap-2.5">
              <span className="w-[104px] shrink-0 truncate text-[12px] text-ink" title={s.source}>
                {s.source}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded bg-surface-3">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${Math.max(3, (s.share / max) * 100)}%`,
                    backgroundColor: SOURCE_COLORS[s.index],
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="w-[42px] shrink-0 text-right tabular text-[12px] font-semibold text-ink">
                {formatPercent(s.share, 1)}
              </span>
              <span className="w-[34px] shrink-0 text-right tabular text-[11.5px] text-ink-muted">
                {formatRating(s.avgRating)}★
              </span>
            </div>
          ))}
        </div>
        <div className="px-0.5 text-[10px] text-ink-faint">
          {formatInt(active.reduce((a, s) => a + s.reviews, 0))} reviews across {active.length}{' '}
          source channels
        </div>
      </div>
    </SectionCard>
  )
}
