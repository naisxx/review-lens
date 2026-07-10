import { CircleCheck, ShieldAlert } from 'lucide-react'
import type { AiInsight } from '@/types'
import { cn } from '@/lib/utils'
import { SectionCard } from './SectionCard'

const TONE_TEXT: Record<AiInsight['tone'], string> = {
  positive: 'text-positive',
  danger: 'text-danger',
  brand: 'text-brand',
  external: 'text-external',
  warning: 'text-warning',
}

/**
 * Opportunities / Threats list. Copy is static AI analysis; the `metric` chip on
 * each row is a real, live delta from the cube.
 */
export function AiInsightPanel({
  title,
  info,
  insights,
  variant,
}: {
  title: string
  info: string
  insights: AiInsight[]
  variant: 'opportunity' | 'threat'
}) {
  const Icon = variant === 'opportunity' ? CircleCheck : ShieldAlert
  const iconColor = variant === 'opportunity' ? 'text-positive' : 'text-danger'

  return (
    <SectionCard
      title={title}
      info={info}
      actions={
        <span className="text-[10px] font-semibold uppercase tracking-wide text-external">AI</span>
      }
      className="h-full"
      bodyClassName="flex min-h-0 flex-col p-3"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-1">
        {insights.map((it) => (
          <div
            key={it.title}
            className="flex gap-2.5 rounded-md p-2 transition-colors hover:bg-surface-2/60"
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconColor)} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[12.5px] font-semibold text-ink">{it.title}</span>
                {it.metric && (
                  <span className={cn('tabular text-[11px] font-semibold', TONE_TEXT[it.tone])}>
                    ({it.metric})
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11.5px] leading-snug text-ink-muted">{it.body}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
