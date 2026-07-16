import { useState } from 'react'
import { SearchX } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { ReasonDriverTarget } from '@/lib/purchase-reasons'
import { Card } from '@/components/ui/card'
import { ScopeSummaryRow } from './ScopeSummaryRow'
import { ExecutiveKpiStrip } from './ExecutiveKpiStrip'
import { PurchaseReasonMatrix } from './PurchaseReasonMatrix'
import { ReviewDrilldown } from './ReviewDrilldown'
import { CustomerDriverOverview } from './CustomerDriverOverview'
import { CustomerDriverHeatmap } from './CustomerDriverHeatmap'
import { TopCustomerDrivers } from './TopCustomerDrivers'
import { CompetitorBenchmarkTable } from './CompetitorBenchmarkTable'
import { AiInsightPanel } from './AiInsightPanel'
import { ExecutiveInsightsStrip } from './ExecutiveInsightsStrip'

export function Overview() {
  const analytics = useAnalytics()
  const { filters, dict, hasData } = analytics
  const navigate = useNavigate()
  const [drill, setDrill] = useState<ReasonDriverTarget | null>(null)

  // "Drill into the reviews / trust behind these numbers" → Review Source page.
  const toReviewSource = {
    label: 'See the reviews & authenticity behind this',
    onClick: () => navigate({ to: '/review-source' }),
  }

  if (!hasData) {
    return (
      <div className="space-y-4">
        <ScopeSummaryRow dict={analytics.dict} filters={analytics.filters} timeLabel={analytics.timeLabel} />
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
      <ScopeSummaryRow dict={analytics.dict} filters={analytics.filters} timeLabel={analytics.timeLabel} />

      <ExecutiveKpiStrip analytics={analytics} />

      {/* Full-width comparison: why they bought × what they value (drills to reviews) */}
      <PurchaseReasonMatrix analytics={analytics} onDrill={setDrill} />

      {/* Row: customer driver (what they value) — brand comparison */}
      <div className="grid grid-cols-12 gap-3.5">
        <div className="col-span-12 lg:col-span-5">
          <CustomerDriverOverview analytics={analytics} drill={toReviewSource} />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <CustomerDriverHeatmap analytics={analytics} />
        </div>
      </div>

      {/* Row: top drivers · opportunities · threats */}
      <div className="grid grid-cols-12 gap-3.5">
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <TopCustomerDrivers analytics={analytics} />
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <AiInsightPanel
            title={`${filters.brand} Opportunities vs Top Peers`}
            info="AI-authored opportunities grounded in real metric gaps versus the category and top peers."
            insights={analytics.opportunities}
            variant="opportunity"
          />
        </div>
        <div className="col-span-12 md:col-span-12 xl:col-span-4">
          <AiInsightPanel
            title={`${filters.brand} Threats vs Top Peers`}
            info="AI-authored threats grounded in real metric gaps versus the category and top peers."
            insights={analytics.threats}
            variant="threat"
          />
        </div>
      </div>

      {/* Row: competitor benchmark (full width, heatmap style) */}
      <CompetitorBenchmarkTable analytics={analytics} drill={toReviewSource} />

      {/* Bottom: executive insights */}
      <ExecutiveInsightsStrip analytics={analytics} />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pb-2 text-[10.5px] text-ink-faint">
        <span>Source: Review Lens by DataLadder.ai</span>
        <span className="text-line-strong">·</span>
        <span>
          {dict.retailer} — {dict.category}
        </span>
        <span className="text-line-strong">·</span>
        <span>{analytics.timeLabel}</span>
      </div>

      <ReviewDrilldown
        target={drill}
        brand={filters.brand}
        onClose={() => setDrill(null)}
      />
    </div>
  )
}
