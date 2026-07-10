import { ShieldCheck, BadgeCheck, GitCompareArrows, TriangleAlert, Layers, MessageSquareText } from 'lucide-react'
import type { AuthenticityResult } from '@/hooks/useAuthenticity'
import { formatInt, formatPercent, formatSignedPoints } from '@/lib/format'
import { KpiCard, type Accent } from './KpiCard'

const pp = (a: number, b: number) => `${formatSignedPoints((a - b) * 100)}pp`

/** Six authenticity KPIs — all derived from the focus brand's live aggregate. */
export function AuthenticityKpiStrip({ analytics }: { analytics: AuthenticityResult }) {
  const { focus, category, coverage } = analytics

  const scoreStatus: { text: string; tone: Accent } =
    focus.authenticityScore >= 88
      ? { text: 'High', tone: 'positive' }
      : focus.authenticityScore >= 80
        ? { text: 'Good', tone: 'brand' }
        : focus.authenticityScore >= 70
          ? { text: 'Fair', tone: 'warning' }
          : { text: 'Watch', tone: 'external' }

  const unvStatus: { text: string; tone: Accent } =
    focus.unverifiedShare <= category.unverifiedShare
      ? { text: 'On par', tone: 'positive' }
      : focus.unverifiedShare <= category.unverifiedShare * 1.15
        ? { text: 'Watch', tone: 'warning' }
        : { text: 'Risk', tone: 'external' }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        index={0}
        icon={ShieldCheck}
        label="Authenticity Score"
        value={focus.authenticityScore}
        format={(v) => formatInt(v)}
        suffix="/ 100"
        sublabel="composite confidence"
        accent="positive"
        status={scoreStatus}
        info="Documented composite of verified rate, first-party share, sentiment consistency, complaint containment and rating-distribution health."
      />
      <KpiCard
        index={1}
        icon={BadgeCheck}
        label="Verified Purchase Rate"
        value={focus.verifiedRate}
        format={(v) => formatPercent(v, 1)}
        sublabel={`vs ${formatPercent(category.verifiedRate, 0)} category`}
        accent="brand"
        delta={{
          value: focus.verifiedRate - category.verifiedRate,
          text: pp(focus.verifiedRate, category.verifiedRate),
          goodWhenUp: true,
        }}
        info="Share of reviews from confirmed purchasers — the strongest single trust signal."
      />
      <KpiCard
        index={2}
        icon={GitCompareArrows}
        label="Sentiment Consistency"
        value={focus.sentimentConsistency}
        format={(v) => formatPercent(v, 1)}
        sublabel={`vs ${formatPercent(category.sentimentConsistency, 0)} category`}
        accent="native"
        delta={{
          value: focus.sentimentConsistency - category.sentimentConsistency,
          text: pp(focus.sentimentConsistency, category.sentimentConsistency),
          goodWhenUp: true,
        }}
        info="Agreement between verified and unverified reviewers on 1–2★ rates. Wide divergence is a manipulation flag."
      />
      <KpiCard
        index={3}
        icon={TriangleAlert}
        label="Unverified Review Share"
        value={focus.unverifiedShare}
        format={(v) => formatPercent(v, 1)}
        sublabel={`vs ${formatPercent(category.unverifiedShare, 0)} category`}
        accent="warning"
        delta={{
          value: focus.unverifiedShare - category.unverifiedShare,
          text: pp(focus.unverifiedShare, category.unverifiedShare),
          goodWhenUp: false,
        }}
        status={unvStatus}
        info="Reviews not tied to a confirmed purchase. Higher share = more manipulation surface to monitor."
      />
      <KpiCard
        index={4}
        icon={Layers}
        label="Reviews per Subcategory"
        value={coverage.perSubcategory}
        format={(v) => formatInt(v)}
        sublabel={`${coverage.subcatsCovered} of ${coverage.totalSubcats} subcats covered`}
        accent="external"
        info="Evidence depth — average reviews across the subcategories the brand appears in (finer product grain isn't in the cube)."
      />
      <KpiCard
        index={5}
        icon={MessageSquareText}
        label="Review Volume (Total)"
        value={focus.reviews}
        format={(v) => formatInt(v)}
        sublabel={`${coverage.regionsCovered} of ${coverage.totalRegions} regions`}
        accent="brand"
        info="Total reviews backing the focus brand in the current scope."
      />
    </div>
  )
}
