import { CalendarRange, MapPin, Layers, Store, Tag, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { CubePayload, Filters } from '@/types'

function summarize(values: string[], allLabel: string): string {
  if (values.length === 0) return allLabel
  if (values.length <= 2) return values.join(', ')
  return `${values.length} selected`
}

function ScopeCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <Card className="flex items-center gap-3 px-3.5 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-3 ring-1 ring-line-strong">
        <Icon className="h-4 w-4 text-ink-muted" />
      </span>
      <div className="min-w-0">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-faint">
          {label}
        </div>
        <div className="truncate text-[13px] font-semibold text-ink" title={value}>
          {value}
        </div>
      </div>
    </Card>
  )
}

/** Horizontal scope summary — mirrors the reference dashboard's context strip. */
export function ScopeSummaryRow({
  dict,
  filters,
  timeLabel,
}: {
  dict: CubePayload['dict']
  filters: Filters
  timeLabel: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <ScopeCard icon={Store} label="Retailer" value={dict.retailer} />
      <ScopeCard icon={Tag} label="Category" value={dict.category} />
      <ScopeCard
        icon={Layers}
        label="Subcategory"
        value={summarize(filters.subcategories, 'All subcategories')}
      />
      <ScopeCard
        icon={MapPin}
        label="Store / Region"
        value={summarize(filters.regions, 'All regions')}
      />
      <ScopeCard icon={CalendarRange} label="Time Period" value={timeLabel} />
    </div>
  )
}
