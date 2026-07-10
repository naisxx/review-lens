import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CountUp } from '@/components/ui/count-up'
import { InfoDot } from '@/components/ui/info-dot'
import { cn } from '@/lib/utils'

export type Accent = 'brand' | 'positive' | 'native' | 'warning' | 'external' | 'neutral'

const ACCENT: Record<Accent, { icon: string; ring: string; bar: string }> = {
  brand: { icon: 'text-brand', ring: 'ring-brand/25 bg-brand/10', bar: 'bg-brand' },
  positive: { icon: 'text-positive', ring: 'ring-positive/25 bg-positive/10', bar: 'bg-positive' },
  native: { icon: 'text-native', ring: 'ring-native/25 bg-native/10', bar: 'bg-native' },
  warning: { icon: 'text-warning', ring: 'ring-warning/25 bg-warning/10', bar: 'bg-warning' },
  external: { icon: 'text-external', ring: 'ring-external/25 bg-external/10', bar: 'bg-external' },
  neutral: { icon: 'text-ink-muted', ring: 'ring-line-strong bg-surface-3', bar: 'bg-neutral' },
}

export interface KpiDelta {
  value: number
  text: string
  /** true when a positive raw delta is good (drives arrow + color). */
  goodWhenUp: boolean
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  format,
  suffix,
  sublabel,
  accent,
  delta,
  status,
  info,
  index = 0,
}: {
  icon: LucideIcon
  label: string
  value: number
  format: (v: number) => string
  suffix?: string
  sublabel: string
  accent: Accent
  delta?: KpiDelta
  status?: { text: string; tone: Accent }
  info: string
  index?: number
}) {
  const a = ACCENT[accent]
  const good = delta ? (delta.value >= 0) === delta.goodWhenUp : false
  const deltaColor = good ? 'text-positive' : 'text-danger'
  const DeltaIcon = delta && delta.value >= 0 ? ArrowUpRight : ArrowDownRight

  return (
    <Card
      className="group relative overflow-hidden animate-fade-in-up hover:border-line-strong"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <span className={cn('absolute inset-x-0 top-0 h-[2px] opacity-70', a.bar)} />
      <div className="p-3.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-md ring-1', a.ring)}>
              <Icon className={cn('h-3.5 w-3.5', a.icon)} />
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
              {label}
            </span>
          </div>
          <InfoDot content={info} />
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <CountUp
            value={value}
            format={format}
            className="tabular text-[30px] font-semibold leading-none tracking-tight text-ink"
          />
          {suffix && <span className="text-[13px] font-medium text-ink-faint">{suffix}</span>}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-ink-faint">{sublabel}</span>
          {delta && (
            <span className={cn('flex shrink-0 items-center gap-0.5 text-[11px] font-medium tabular', deltaColor)}>
              <DeltaIcon className="h-3 w-3" />
              {delta.text}
            </span>
          )}
          {status && (
            <span
              className={cn(
                'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                ACCENT[status.tone].ring,
                ACCENT[status.tone].icon,
              )}
            >
              {status.text}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
