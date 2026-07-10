import type { AuthenticityResult } from '@/hooks/useAuthenticity'
import { useFilters } from '@/components/providers/FilterProvider'
import { formatPercent, formatRating, formatInt } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SectionCard } from './SectionCard'

/** Green/red tint by absolute threshold (columns lack a per-brand category ref). */
function tone(v: number, good: number, bad: number, higherBetter = true): string {
  const hi = higherBetter ? v >= good : v <= good
  const lo = higherBetter ? v <= bad : v >= bad
  if (hi) return 'text-positive'
  if (lo) return 'text-danger'
  return 'text-ink'
}

/** Per-brand authenticity comparison. Click a row to make that brand the focus. */
export function AuthenticityByBrand({ analytics }: { analytics: AuthenticityResult }) {
  const { brandRows } = analytics
  const { setFilter } = useFilters()

  return (
    <SectionCard
      title="Authenticity by Brand"
      info="Every brand in scope on the authenticity signals, ranked by score. Scroll for more. Click any row to make that brand the focus across both pages."
      bodyClassName="p-0"
    >
      <div className="max-h-[344px] overflow-y-auto overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              <th className="px-3 py-2 text-left">Brand</th>
              <th className="px-3 py-2 text-right">Auth. Score</th>
              <th className="px-3 py-2 text-right">Verified</th>
              <th className="px-3 py-2 text-right">Consistency</th>
              <th className="px-3 py-2 text-right">First-Party</th>
              <th className="px-3 py-2 text-right">Complaint</th>
              <th className="px-3 py-2 text-right">Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {brandRows.map((r) => (
              <tr
                key={r.brand}
                onClick={() => setFilter('brand', r.brand)}
                className={cn(
                  'cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2/60',
                  r.isFocus && 'bg-brand/[0.06]',
                )}
              >
                <td className={cn('px-3 py-2 font-medium', r.isFocus ? 'text-brand' : 'text-ink')}>
                  {r.brand}
                </td>
                <td className="px-3 py-2 text-right tabular font-semibold text-ink">
                  {formatInt(r.score)}
                </td>
                <td className={cn('px-3 py-2 text-right tabular', tone(r.verifiedRate, 0.72, 0.6))}>
                  {formatPercent(r.verifiedRate, 1)}
                </td>
                <td
                  className={cn('px-3 py-2 text-right tabular', tone(r.sentimentConsistency, 0.9, 0.75))}
                >
                  {formatPercent(r.sentimentConsistency, 1)}
                </td>
                <td className={cn('px-3 py-2 text-right tabular', tone(r.firstPartyShare, 0.9, 0.7))}>
                  {formatPercent(r.firstPartyShare, 1)}
                </td>
                <td className={cn('px-3 py-2 text-right tabular', tone(r.complaintRate, 0.15, 0.3, false))}>
                  {formatPercent(r.complaintRate, 1)}
                </td>
                <td className="px-3 py-2 text-right tabular text-ink">{formatRating(r.avgRating)}★</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
