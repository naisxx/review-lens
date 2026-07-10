import { Lightbulb } from 'lucide-react'
import type { AnalyticsResult } from '@/hooks/useAnalytics'
import type { AiInsight } from '@/types'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const TONE_TEXT: Record<AiInsight['tone'], string> = {
  positive: 'text-positive',
  danger: 'text-danger',
  brand: 'text-brand',
  external: 'text-external',
  warning: 'text-warning',
}

/** Bottom strip: rule-based executive read, each grounded in a real metric. */
export function ExecutiveInsightsStrip({ analytics }: { analytics: AnalyticsResult }) {
  const { execInsights } = analytics
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[190px_1fr]">
        <div className="flex items-center gap-2.5 border-b border-line bg-surface-2/50 px-4 py-3 md:border-b-0 md:border-r">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-external/12 ring-1 ring-external/25">
            <Lightbulb className="h-4 w-4 text-external" />
          </span>
          <div className="leading-tight">
            <div className="text-[12.5px] font-semibold text-ink">Executive Insights</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-external">
              AI generated
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-5 xl:divide-x">
          {execInsights.map((it) => (
            <div key={it.title} className="px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                {it.title}
              </div>
              <p className="mt-1 text-[11.5px] leading-snug text-ink-muted">{it.body}</p>
              {it.metric && (
                <div className={cn('mt-1.5 tabular text-[11px] font-semibold', TONE_TEXT[it.tone])}>
                  {it.metric}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
