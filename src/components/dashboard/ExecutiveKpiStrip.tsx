import { Star, ShieldCheck, TriangleAlert, TrendingUp, PieChart } from 'lucide-react'
import type { AnalyticsResult } from '@/hooks/useAnalytics'
import {
  formatInt,
  formatPercent,
  formatRating,
  formatSignedPoints,
  formatSignedRating,
} from '@/lib/format'
import { KpiCard, type Accent } from './KpiCard'

const signedPct = (ratio: number) => `${formatSignedPoints(ratio * 100)}%`

/** The five executive KPIs, each derived from the focus brand's live aggregate. */
export function ExecutiveKpiStrip({ analytics }: { analytics: AnalyticsResult }) {
  const { focus, category, growthFocus, growthCategory, share } = analytics

  const negStatus: { text: string; tone: Accent } =
    focus.negativeRate <= category.negativeRate
      ? { text: 'On par', tone: 'positive' }
      : focus.negativeRate <= category.negativeRate * 1.15
        ? { text: 'Watch', tone: 'warning' }
        : { text: 'Risk', tone: 'external' }

  const catGap = category.verifiedUnverifiedGap

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        index={0}
        icon={Star}
        label="Average Rating"
        value={focus.avgRating}
        format={(v) => formatRating(v)}
        suffix="★"
        sublabel={`vs ${formatRating(category.avgRating)} category avg`}
        accent="brand"
        delta={{
          value: focus.avgRating - category.avgRating,
          text: formatSignedRating(focus.avgRating - category.avgRating),
          goodWhenUp: true,
        }}
        info="Focus-brand mean star rating versus the category average within the current scope."
      />

      <KpiCard
        index={1}
        icon={ShieldCheck}
        label="Verified vs Unverified Gap"
        value={focus.verifiedUnverifiedGap}
        format={(v) => formatSignedRating(v)}
        suffix="★"
        sublabel={`${formatRating(focus.verifiedRating)}★ verified · ${formatRating(focus.unverifiedRating)}★ unverified`}
        accent="native"
        delta={{
          value: focus.verifiedUnverifiedGap - catGap,
          text: `${formatSignedRating(focus.verifiedUnverifiedGap - catGap)} vs cat`,
          goodWhenUp: true,
        }}
        info="Difference between the average rating of verified-purchase and unverified reviews. A wider positive gap indicates verified buyers rate more favourably."
      />

      <KpiCard
        index={2}
        icon={TriangleAlert}
        label="Negative Review Rate"
        value={focus.negativeRate}
        format={(v) => formatPercent(v, 1)}
        sublabel={`vs ${formatPercent(category.negativeRate, 1)} category · 1–2★`}
        accent="warning"
        delta={{
          value: focus.negativeRate - category.negativeRate,
          text: `${formatSignedPoints((focus.negativeRate - category.negativeRate) * 100)}pp`,
          goodWhenUp: false,
        }}
        status={negStatus}
        info="Share of 1–2★ reviews out of all reviews, compared with the category average. Lower is better."
      />

      <KpiCard
        index={3}
        icon={TrendingUp}
        label="Review Growth"
        value={growthFocus.value}
        format={signedPct}
        sublabel={`vs ${signedPct(growthCategory.value)} category trend`}
        accent="positive"
        delta={{
          value: growthFocus.value - growthCategory.value,
          text: `${formatSignedPoints((growthFocus.value - growthCategory.value) * 100)}pp`,
          goodWhenUp: true,
        }}
        info="Year-over-year change in review volume (most recent 12 months vs. the prior 12), against the category trend."
      />

      <KpiCard
        index={4}
        icon={PieChart}
        label="Share of Category Reviews"
        value={share}
        format={(v) => formatPercent(v, 1)}
        sublabel={`${formatInt(focus.reviews)} of ${formatInt(category.reviews)} reviews`}
        accent="external"
        info="Focus-brand review volume as a share of all reviews in the current scope."
      />
    </div>
  )
}
