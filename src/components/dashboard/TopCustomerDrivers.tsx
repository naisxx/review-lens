import {
  BadgeCheck,
  Package,
  Palette,
  ShieldCheck,
  Sparkles,
  Tag,
  Wrench,
  Headset,
  type LucideIcon,
} from 'lucide-react'
import type { AnalyticsResult } from '@/hooks/useAnalytics'
import type { DriverKey } from '@/lib/theme-detection'
import { DRIVER_COLORS } from '@/components/charts/chart-theme'
import { formatSignedPoints } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SectionCard } from './SectionCard'

const DRIVER_ICON: Record<DriverKey, LucideIcon> = {
  installation: Wrench,
  appearance: Sparkles,
  finish: Palette,
  quality: BadgeCheck,
  value: Tag,
  durability: ShieldCheck,
  packaging: Package,
  service: Headset,
}

export function TopCustomerDrivers({ analytics }: { analytics: AnalyticsResult }) {
  const { topDrivers, filters } = analytics

  return (
    <SectionCard
      title={`Top Customer Drivers for ${filters.brand}`}
      info="The five strongest customer drivers for the focus brand by detected share. Deltas are live vs. category average; the descriptions are static analyst copy."
      actions={<span className="text-[10px] font-semibold uppercase tracking-wide text-external">AI</span>}
      className="h-full"
      bodyClassName="flex flex-col p-3"
    >
      <div className="flex h-full flex-col justify-between gap-1">
        {topDrivers.map(({ driver, body }) => {
          const Icon = DRIVER_ICON[driver.key]
          const up = driver.delta >= 0
          return (
            <div
              key={driver.key}
              className="flex gap-2.5 rounded-md p-2 transition-colors hover:bg-surface-2/60"
            >
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ring-inset"
                style={{
                  backgroundColor: `${DRIVER_COLORS[driver.index]}1f`,
                  color: DRIVER_COLORS[driver.index],
                }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12.5px] font-semibold text-ink">{driver.label}</span>
                  <span
                    className={cn(
                      'tabular text-[11px] font-semibold',
                      up ? 'text-positive' : 'text-danger',
                    )}
                  >
                    {formatSignedPoints(driver.delta * 100)}pp
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] leading-snug text-ink-muted">{body}</p>
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
