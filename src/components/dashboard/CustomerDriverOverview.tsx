import type { AnalyticsResult } from '@/hooks/useAnalytics'
import { ClientOnly } from '@/components/ui/client-only'
import { Skeleton } from '@/components/ui/skeleton'
import { DriverDonut } from '@/components/charts/DriverDonut'
import { DRIVER_COLORS } from '@/components/charts/chart-theme'
import { formatPercent, formatSignedPoints } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SectionCard } from './SectionCard'

function deltaColor(delta: number): string {
  if (delta > 0.005) return 'text-positive'
  if (delta < -0.005) return 'text-danger'
  return 'text-ink-muted'
}

/** Donut + legend table of customer drivers: focus brand vs. category average. */
export function CustomerDriverOverview({ analytics }: { analytics: AnalyticsResult }) {
  const { drivers, driverTotal, filters } = analytics

  return (
    <SectionCard
      title="Customer Driver Overview"
      info="Share of detected positive customer drivers for the focus brand versus the category average. Driver mix is modelled deterministically from real rating, verification, recommendation and source signals (the shipped cube stores aggregates, not raw text)."
      className="h-full"
      actions={
        <span className="text-[10.5px] font-medium text-ink-faint">
          {filters.brand} vs Category Avg
        </span>
      }
    >
      <div className="grid h-full grid-cols-[160px_1fr] items-stretch gap-4">
        <div className="flex items-center justify-center">
          <div className="aspect-square w-full max-h-full">
            <ClientOnly fallback={<Skeleton className="h-full w-full rounded-full" />}>
              <DriverDonut data={drivers} total={driverTotal} />
            </ClientOnly>
          </div>
        </div>

        <div className="flex min-w-0 flex-col overflow-hidden">
          <table className="h-full w-full text-[12px]">
            <thead>
              <tr className="text-[9.5px] uppercase tracking-wide text-ink-faint">
                <th className="pb-1 pr-2 text-left font-semibold">Driver</th>
                <th className="px-2 pb-1 text-right font-semibold">{filters.brand}</th>
                <th className="px-2 pb-1 text-right font-semibold">Cat.</th>
                <th className="pb-1 pl-2 text-right font-semibold">Δ</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.key} className="border-t border-line/50">
                  <td className="pr-2">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: DRIVER_COLORS[d.index] }}
                      />
                      <span className="truncate text-ink">{d.label}</span>
                    </span>
                  </td>
                  <td className="px-2 text-right tabular font-medium text-ink">
                    {formatPercent(d.brandShare, 1)}
                  </td>
                  <td className="px-2 text-right tabular text-ink-muted">
                    {formatPercent(d.categoryShare, 1)}
                  </td>
                  <td
                    className={cn('pl-2 text-right tabular font-medium', deltaColor(d.delta))}
                  >
                    {formatSignedPoints(d.delta * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  )
}
