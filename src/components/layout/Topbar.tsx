import { CalendarRange, Download, Scale, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComboBox } from '@/components/ui/combobox'
import { InfoDot } from '@/components/ui/info-dot'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFilters } from '@/components/providers/FilterProvider'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { BenchmarkMode, TimePreset } from '@/types'

const TIME_OPTIONS: { value: TimePreset; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'l12m', label: 'Last 12 months' },
  { value: 'l24m', label: 'Last 24 months' },
  { value: 'l36m', label: 'Last 36 months' },
  { value: 'ytd', label: 'Year to date' },
]

const BENCHMARK_OPTIONS: { value: BenchmarkMode; label: string }[] = [
  { value: 'category-average', label: 'Category Average' },
  { value: 'market-leaders', label: 'Market Leaders' },
]

/** Builds the "{Brand} Executive Review Overview — vs A, B, C & D" title. */
function competitorList(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}

export function Topbar() {
  const { filters, setFilter, dict } = useFilters()
  const { competitorNames, timeLabel } = useAnalytics()
  const competitors = competitorList(competitorNames)

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-surface/60 px-5 py-2.5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-[17px] font-semibold tracking-tight text-ink">
          <span className="text-brand">{filters.brand}</span> Executive Review Overview
          {competitors && (
            <span className="font-medium text-ink-muted"> — vs {competitors}</span>
          )}
        </h1>
        <InfoDot content="Executive benchmark of the focus brand against its top competitors — rating, verified vs. unverified behaviour, complaint pressure, customer drivers, review growth and category share. All metrics are live from the review corpus." />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-ink-faint xl:inline">
            Brand
          </span>
          <div className="w-[168px]">
            <ComboBox
              options={dict.brands}
              value={filters.brand}
              onChange={(v) => setFilter('brand', v)}
              placeholder="Search brands…"
            />
          </div>
        </div>

        <div className="hidden items-center gap-1.5 lg:flex">
          <CalendarRange className="h-3.5 w-3.5 text-ink-faint" />
          <div className="w-[148px]">
            <Select
              value={filters.time}
              onValueChange={(v) => setFilter('time', v as TimePreset)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 xl:flex">
          <Scale className="h-3.5 w-3.5 text-ink-faint" />
          <div className="w-[150px]">
            <Select
              value={filters.benchmark}
              onValueChange={(v) => setFilter('benchmark', v as BenchmarkMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BENCHMARK_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button size="sm" variant="default" className="lg:hidden">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
        <span className="hidden text-[11px] text-ink-faint 2xl:inline tabular">{timeLabel}</span>
        <Button size="sm" variant="brand">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Export</span>
        </Button>
      </div>
    </header>
  )
}
