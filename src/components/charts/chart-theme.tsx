/** Shared chart palette + primitives so every Recharts view stays on-theme. */

export const CHART = {
  grid: '#232a38',
  axis: '#5f6b80',
  tooltipBg: '#1b212d',
  tooltipBorder: '#303849',
  ink: '#e8ebf2',
  muted: '#93a0b5',
} as const

/** Source-category colors, aligned with `SOURCE_LABELS` order. */
export const SOURCE_COLORS = [
  '#3b9dd6', // Native (On-site)
  '#4bb47c', // Brand Sites
  '#a78bda', // External Retail
  '#d99a3a', // Social / Forums
  '#6b7688', // Other
] as const

/** Customer-driver colors, aligned with `DRIVER_THEMES` order (8 entries). */
export const DRIVER_COLORS = [
  '#2dd0bd', // Easy Installation
  '#3b9dd6', // Appearance / Design
  '#a78bda', // Finish Quality
  '#4bb47c', // Product Quality
  '#d99a3a', // Value / Price
  '#dd6070', // Durability
  '#7c8aa5', // Packaging
  '#c76fa0', // Customer Service
] as const

/** Reviewer Trust Mix colors, aligned with `reviewerTrustMix` segment order. */
export const TRUST_COLORS = [
  '#4bb47c', // Verified Advocates
  '#d99a3a', // Verified Critics
  '#3b9dd6', // Unverified Voices
  '#dd6070', // Unverified Complaints
] as const

export const BRAND_TEAL = '#2dd0bd'
export const POSITIVE = '#4bb47c'
export const WARNING = '#d99a3a'
export const DANGER = '#dd6070'

interface TooltipRow {
  label: string
  value: string
  color?: string
}

/** Consistent tooltip card used across charts. */
export function ChartTooltip({
  title,
  rows,
}: {
  title: string
  rows: TooltipRow[]
}) {
  return (
    <div className="rounded-lg border border-line-strong bg-surface-3 px-3 py-2 shadow-xl shadow-black/50">
      <div className="mb-1.5 text-[11.5px] font-semibold text-ink">{title}</div>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-ink-muted">
              {r.color && (
                <span
                  className="h-2 w-2 rounded-[2px]"
                  style={{ backgroundColor: r.color }}
                />
              )}
              {r.label}
            </span>
            <span className="tabular font-medium text-ink">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
