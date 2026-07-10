import { SearchX } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthenticity } from '@/hooks/useAuthenticity'
import { Card } from '@/components/ui/card'
import { ClientOnly } from '@/components/ui/client-only'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthTrendChart } from '@/components/charts/AuthTrendChart'
import { ScopeSummaryRow } from './ScopeSummaryRow'
import { AuthenticityKpiStrip } from './AuthenticityKpiStrip'
import { AuthenticityBreakdown } from './AuthenticityBreakdown'
import { ReviewerTrustMix } from './ReviewerTrustMix'
import { SourceDistribution } from './SourceDistribution'
import { AuthenticityByBrand } from './AuthenticityByBrand'
import { AiInsightPanel } from './AiInsightPanel'
import { SectionCard } from './SectionCard'

export function ReviewSource() {
  const analytics = useAuthenticity()
  const { filters, dict, hasData } = analytics
  const navigate = useNavigate()

  // "Drill into the reviews behind the business numbers" → the Executive Overview.
  const toOverview = {
    label: 'Open the Executive Overview',
    onClick: () => navigate({ to: '/' }),
  }

  if (!hasData) {
    return (
      <div className="space-y-4">
        <ScopeSummaryRow dict={dict} filters={filters} timeLabel={analytics.timeLabel} />
        <Card className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <SearchX className="h-8 w-8 text-ink-faint" />
          <div>
            <div className="text-[15px] font-semibold text-ink">No reviews in this scope</div>
            <p className="mt-1 max-w-sm text-[12.5px] text-ink-faint">
              {filters.brand} has no reviews matching the current subcategory, region and time
              filters. Widen the filters or pick another brand focus.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      <ScopeSummaryRow dict={dict} filters={filters} timeLabel={analytics.timeLabel} />

      <AuthenticityKpiStrip analytics={analytics} />

      {/* Row: breakdown · trust mix · key takeaways */}
      <div className="grid grid-cols-12 gap-3.5">
        <div className="col-span-12 xl:col-span-5 xl:h-[344px]">
          <AuthenticityBreakdown analytics={analytics} drill={toOverview} />
        </div>
        <div className="col-span-12 md:col-span-7 xl:col-span-4 xl:h-[344px]">
          <ReviewerTrustMix analytics={analytics} drill={toOverview} />
        </div>
        <div className="col-span-12 md:col-span-5 xl:col-span-3 xl:h-[344px]">
          <AiInsightPanel
            title="Key Takeaways"
            info="Analyst-style read of the authenticity posture; every figure shown is a live, cube-derived metric."
            insights={analytics.takeaways}
            variant="opportunity"
          />
        </div>
      </div>

      {/* Row: source distribution · authenticity over time · risks */}
      <div className="grid grid-cols-12 gap-3.5">
        <div className="col-span-12 md:col-span-6 xl:col-span-4 xl:h-[300px]">
          <SourceDistribution analytics={analytics} drill={toOverview} />
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-5 xl:h-[300px]">
          <SectionCard
            title="Authenticity Over Time"
            info="Monthly authenticity score for the focus brand versus the category average, over the reviews in scope."
            className="h-full"
            bodyClassName="min-h-0 p-3"
            actions={
              <span className="text-[10.5px] font-medium text-ink-faint">
                {filters.brand} vs Category Avg
              </span>
            }
          >
            <div className="h-full min-h-[200px]">
              <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
                <AuthTrendChart data={analytics.authTrend} />
              </ClientOnly>
            </div>
          </SectionCard>
        </div>
        <div className="col-span-12 xl:col-span-3 xl:h-[300px]">
          <AiInsightPanel
            title="Risks to Monitor"
            info="Real warning signals for the authenticity of the review base — grounded in live metrics."
            insights={analytics.risks}
            variant="threat"
          />
        </div>
      </div>

      {/* Row: authenticity by brand (full width) */}
      <AuthenticityByBrand analytics={analytics} />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pb-2 text-[10.5px] text-ink-faint">
        <span>Source: review-derived authenticity signals</span>
        <span className="text-line-strong">·</span>
        <span>
          {dict.retailer} — {dict.category}
        </span>
        <span className="text-line-strong">·</span>
        <span>{analytics.timeLabel}</span>
        <span className="text-line-strong">·</span>
        <span>Confidence: {analytics.focus.authenticityScore >= 80 ? 'high' : 'moderate'}</span>
      </div>
    </div>
  )
}
