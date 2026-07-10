import type { AnalyticsResult } from '@/hooks/useAnalytics'
import { DRIVER_THEMES } from '@/lib/theme-detection'
import { formatPercent, formatSignedPoints } from '@/lib/format'
import { heatColor, HEAT_LEGEND } from '@/lib/heat'
import { cn } from '@/lib/utils'
import { SectionCard } from './SectionCard'

/** ±2pp maps to the full red→green range. */
const HEAT_SPAN = 2

export function CustomerDriverHeatmap({ analytics }: { analytics: AnalyticsResult }) {
  const { heatmap, filters } = analytics

  return (
    <SectionCard
      title="Customer Driver Heatmap"
      info="Share of each customer driver by brand versus the category average. Green = above category, amber = near, red = below. Driver mix is modelled from real cube signals."
      className="h-full"
      actions={
        <span className="text-[10.5px] font-medium text-ink-faint">
          {filters.brand} vs Competitors
        </span>
      }
      bodyClassName="flex flex-col p-3"
    >
      <div className="flex-1 overflow-x-auto">
        <table className="h-full w-full border-separate border-spacing-[3px] text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface px-1 py-1 text-left text-[9.5px] font-semibold uppercase tracking-wide text-ink-faint">
                Brand
              </th>
              {DRIVER_THEMES.map((t) => (
                <th
                  key={t.key}
                  className="px-1 py-1 text-center text-[9px] font-semibold uppercase tracking-wide text-ink-faint"
                >
                  {t.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.map((row) => (
              <tr key={row.brand}>
                <td
                  className={cn(
                    'sticky left-0 z-10 whitespace-nowrap bg-surface px-1 py-1 text-[11.5px] font-medium',
                    row.isFocus ? 'text-brand' : row.isCategory ? 'italic text-ink-muted' : 'text-ink',
                  )}
                >
                  {row.brand}
                </td>
                {row.cells.map((cell) => {
                  const deltaPp = cell.delta * 100
                  return (
                    <td
                      key={cell.key}
                      className="rounded-[4px] px-1 py-1 text-center align-middle"
                      style={
                        row.isCategory
                          ? undefined
                          : { backgroundColor: heatColor(deltaPp / HEAT_SPAN) }
                      }
                    >
                      <div className="tabular text-[11px] font-semibold text-ink">
                        {formatPercent(cell.value, 0)}
                      </div>
                      {!row.isCategory && (
                        <div className="tabular text-[8.5px] leading-tight text-ink/70">
                          {formatSignedPoints(deltaPp)}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scale legend — swatches share the exact cell colours */}
      <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[9.5px] text-ink-faint">
        <span className="shrink-0">Lower than Category Avg</span>
        <div className="flex items-center gap-[3px]">
          {HEAT_LEGEND.map((c, i) => (
            <span
              key={i}
              className="h-[11px] w-[11px] rounded-[2px]"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <span className="shrink-0">Higher than Category Avg</span>
      </div>
    </SectionCard>
  )
}
