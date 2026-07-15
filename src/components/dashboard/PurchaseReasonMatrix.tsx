import { useState } from 'react'
import type { AnalyticsResult } from '@/hooks/useAnalytics'
import {
  DRIVER_COLUMNS,
  PURCHASE_REASONS,
  type PurchaseReasonDatum,
  type PurchaseReasonKey,
  type ReasonDriverTarget,
} from '@/lib/purchase-reasons'
import { formatPercent, formatSignedPoints } from '@/lib/format'
import { heatColor, HEAT_LEGEND, valueHeat, VALUE_LEGEND } from '@/lib/heat'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/ui/brand-logo'
import { SectionCard } from './SectionCard'

const DRIVER_SPAN = 0.08 // ±8pp → full range (reason × driver, diverging)
const VALUE_DOMAIN = 0.2 // 20%+ share → full green (brand × reason, magnitude)

type View = 'drivers' | 'competitors'

/**
 * Purchase Reason analysis with two views in one panel:
 *  • × Customer Driver — for the focus brand, which drivers each reason leans on.
 *  • vs Competitors    — how each brand's purchase-reason mix compares to category.
 * Both are drillable to the underlying reviews.
 */
export function PurchaseReasonMatrix({
  analytics,
  onDrill,
}: {
  analytics: AnalyticsResult
  onDrill: (target: ReasonDriverTarget) => void
}) {
  const [view, setView] = useState<View>('drivers')
  const { reasonMatrix, reasonCompetitors, purchaseReasons } = analytics
  const byKey = new Map<PurchaseReasonKey, PurchaseReasonDatum>(
    purchaseReasons.reasons.map((r) => [r.key, r]),
  )
  const maxShare = Math.max(...purchaseReasons.reasons.map((r) => r.share), 0.0001)

  const toggle = (
    <div className="flex items-center gap-0.5 rounded-md bg-surface-3 p-0.5">
      {(
        [
          ['drivers', '× Customer Driver'],
          ['competitors', 'vs Competitors'],
        ] as [View, string][]
      ).map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => setView(v)}
          className={cn(
            'rounded px-2 py-[3px] text-[10.5px] font-medium transition-colors',
            view === v ? 'bg-surface text-ink shadow-sm' : 'text-ink-faint hover:text-ink',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <SectionCard
      title="Purchase Reason Analysis"
      info={
        view === 'drivers'
          ? "Why they bought (rows) vs. what they value (columns), for the focus brand. Each cell is the share of that reason's buyers who over-index on a driver (green = above the cross-reason average). Click a cell for that reason × driver's reviews."
          : 'How each brand’s purchase-reason mix compares with the category average — green = over-indexes, red = under-indexes. Click any cell to drill into that brand × reason’s reviews.'
      }
      className="h-full"
      actions={toggle}
      bodyClassName="flex flex-col p-3"
    >
      <div className="flex-1 overflow-x-auto">
        {view === 'drivers' ? (
          /* ---- Reason × Customer Driver (focus brand) ---- */
          <table className="h-full w-full border-separate border-spacing-[3px] text-[11px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-surface px-1 py-1 text-left text-[9px] font-semibold uppercase tracking-wide text-ink-faint">
                  Reason
                </th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold uppercase tracking-wide text-ink-faint">
                  Share
                </th>
                {DRIVER_COLUMNS.map((d) => (
                  <th
                    key={d.key}
                    className="px-1 py-1 text-center text-[8.5px] font-semibold uppercase tracking-wide text-ink-faint"
                  >
                    {d.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reasonMatrix.map((row) => {
                const datum = byKey.get(row.key)
                if (!datum) return null
                return (
                  <tr key={row.key}>
                    <td
                      onClick={() => onDrill({ reason: datum })}
                      className="sticky left-0 z-10 cursor-pointer whitespace-nowrap bg-surface px-1 py-1 text-[11px] font-medium text-ink hover:text-brand"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: row.color }} />
                        {row.label}
                      </span>
                    </td>
                    <td onClick={() => onDrill({ reason: datum })} className="cursor-pointer whitespace-nowrap px-2 py-1">
                      <span className="flex items-center gap-1.5">
                        <span className="tabular w-[34px] text-[11px] font-semibold text-ink">
                          {formatPercent(datum.share, 0)}
                        </span>
                        <span className="relative h-1.5 w-[52px] overflow-hidden rounded-full bg-surface-3">
                          <span
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ width: `${(datum.share / maxShare) * 100}%`, backgroundColor: row.color }}
                          />
                        </span>
                      </span>
                    </td>
                    {row.cells.map((cell, i) => (
                      <td
                        key={DRIVER_COLUMNS[i].key}
                        onClick={() =>
                          onDrill({ reason: datum, driverKey: DRIVER_COLUMNS[i].key, driverLabel: DRIVER_COLUMNS[i].label })
                        }
                        title={`${row.label} × ${DRIVER_COLUMNS[i].label}: ${formatPercent(cell.value, 0)} · click for reviews`}
                        className="cursor-pointer rounded-[4px] px-1 py-1 text-center align-middle tabular text-[11px] font-semibold text-ink outline-none transition-shadow hover:ring-2 hover:ring-brand/70"
                        style={{ backgroundColor: heatColor(cell.delta / DRIVER_SPAN) }}
                      >
                        {formatPercent(cell.value, 0)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          /* ---- Brand × Reason (competitor comparison) ---- */
          <table className="h-full w-full border-separate border-spacing-[3px] text-[11px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-surface px-1 py-1 text-left text-[9px] font-semibold uppercase tracking-wide text-ink-faint">
                  Brand
                </th>
                {PURCHASE_REASONS.map((r) => (
                  <th
                    key={r.key}
                    className="px-1 py-1 text-center text-[8.5px] font-semibold uppercase tracking-wide text-ink-faint"
                  >
                    {r.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reasonCompetitors.map((row) => (
                <tr key={row.brand}>
                  <td
                    className={cn(
                      'sticky left-0 z-10 whitespace-nowrap bg-surface px-1 py-1 text-[11px] font-medium',
                      row.isFocus ? 'text-brand' : row.isCategory ? 'italic text-ink-muted' : 'text-ink',
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {!row.isCategory && <BrandLogo name={row.brand} />}
                      {row.brand}
                    </span>
                  </td>
                  {row.cells.map((cell, i) => {
                    const reasonDef = PURCHASE_REASONS[i]
                    const drillDatum: PurchaseReasonDatum = {
                      key: reasonDef.key,
                      label: reasonDef.label,
                      short: reasonDef.short,
                      color: reasonDef.color,
                      share: cell.value,
                      count: Math.round(cell.value * row.total),
                      delta: cell.delta,
                      index: i,
                    }
                    return (
                      <td
                        key={reasonDef.key}
                        onClick={
                          row.isCategory
                            ? undefined
                            : () => onDrill({ reason: drillDatum, brand: row.brand })
                        }
                        title={
                          row.isCategory
                            ? undefined
                            : `${row.brand} · ${reasonDef.label}: ${formatPercent(cell.value, 0)} (${formatSignedPoints(cell.delta * 100)}pp) · click for reviews`
                        }
                        className={cn(
                          'rounded-[4px] px-1 py-1 text-center align-middle',
                          !row.isCategory && 'cursor-pointer outline-none transition-shadow hover:ring-2 hover:ring-white/50',
                        )}
                        style={row.isCategory ? undefined : { backgroundColor: valueHeat(cell.value / VALUE_DOMAIN) }}
                      >
                        <div
                          className={cn(
                            'tabular text-[11px] font-bold',
                            row.isCategory ? 'text-ink' : 'text-[#0a0d13]',
                          )}
                        >
                          {formatPercent(cell.value, 0)}
                        </div>
                        {!row.isCategory && (
                          <div className="tabular text-[8.5px] font-semibold leading-tight text-[#0a0d13]/70">
                            {formatSignedPoints(cell.delta * 100)}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[9.5px] text-ink-faint">
        <span className="shrink-0">{view === 'drivers' ? 'Under-indexes' : 'Lower share'}</span>
        <div className="flex items-center gap-[3px]">
          {(view === 'drivers' ? HEAT_LEGEND : VALUE_LEGEND).map((c, i) => (
            <span key={i} className="h-[11px] w-[11px] rounded-[2px]" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span className="shrink-0">
          {view === 'drivers' ? 'Over-indexes on driver' : 'Higher share'}
        </span>
      </div>
    </SectionCard>
  )
}
