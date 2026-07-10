import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { InfoDot, type DrillAction } from '@/components/ui/info-dot'
import { cn } from '@/lib/utils'

/** Titled panel used for every dashboard module (chart, table, list). */
export function SectionCard({
  title,
  info,
  drill,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string
  info?: string
  /** When set, the `?` becomes a click-popover with a drill-down action. */
  drill?: DrillAction
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-muted">
            {title}
          </h3>
          {info && <InfoDot content={info} drill={drill} />}
        </div>
        {actions}
      </div>
      <div className={cn('min-h-0 flex-1 p-4', bodyClassName)}>{children}</div>
    </Card>
  )
}
