import type { AuthenticityResult } from '@/hooks/useAuthenticity'
import type { DrillAction } from '@/components/ui/info-dot'
import { ClientOnly } from '@/components/ui/client-only'
import { Skeleton } from '@/components/ui/skeleton'
import { TrustDonut } from '@/components/charts/TrustDonut'
import { TRUST_COLORS } from '@/components/charts/chart-theme'
import { formatInt, formatPercent } from '@/lib/format'
import { SectionCard } from './SectionCard'

/** Donut + legend of the reviewer base partitioned by verification × sentiment. */
export function ReviewerTrustMix({
  analytics,
  drill,
}: {
  analytics: AuthenticityResult
  drill?: DrillAction
}) {
  const { trustMix, trustTotal, filters } = analytics

  return (
    <SectionCard
      title="Reviewer Trust Mix"
      info="Exact 4-way split of every review by verification × sentiment (no estimation): verified vs. unverified reviewers, each split into supportive vs. 1–2★ critical."
      className="h-full"
      drill={drill}
      actions={
        <span className="text-[10.5px] font-medium text-ink-faint">{filters.brand}</span>
      }
    >
      <div className="grid h-full grid-cols-[128px_1fr] items-stretch gap-4">
        <div className="flex items-center justify-center">
          <div className="aspect-square w-full max-h-full">
            <ClientOnly fallback={<Skeleton className="h-full w-full rounded-full" />}>
              <TrustDonut data={trustMix} total={trustTotal} />
            </ClientOnly>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <table className="w-full text-[12px]">
            <tbody>
              {trustMix.map((s) => (
                <tr key={s.key} className="border-b border-line/40 last:border-0">
                  <td className="py-[7px] pr-2">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: TRUST_COLORS[s.index] }}
                      />
                      <span className="truncate text-ink">{s.label}</span>
                    </span>
                  </td>
                  <td className="px-2 py-[7px] text-right tabular text-ink-muted">
                    {formatInt(s.count)}
                  </td>
                  <td className="py-[7px] pl-2 text-right tabular font-semibold text-ink">
                    {formatPercent(s.share, 1)}
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
