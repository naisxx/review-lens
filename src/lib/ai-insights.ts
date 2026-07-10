/**
 * AI-authored strategic narrative for the executive overview.
 *
 * The COPY is static/rule-based (an analyst-style read of the posture) and is
 * badged "AI" in the UI. The NUMBERS threaded into each card are real, live
 * deltas computed from the cube — so the wording is qualitative but every metric
 * shown is genuine and moves with the filters.
 */

import type { AiInsight, DriverDatum, Growth, Metrics } from '@/types'
import type { DriverKey } from './theme-detection'
import {
  formatPercent,
  formatSignedPoints,
  formatSignedRating,
} from './format'

export interface InsightContext {
  brand: string
  competitorNames: string[]
  focus: Metrics
  category: Metrics
  peer: Metrics
  growthFocus: Growth
  growthCategory: Growth
  share: number
  drivers: DriverDatum[]
}

const pts = (ratio: number) => `${formatSignedPoints(ratio * 100)}pp`
const topPeer = (names: string[]) => names[0] ?? 'top peers'

/** Descriptions for the Top Customer Drivers cards (static copy per driver). */
const DRIVER_COPY: Record<DriverKey, string> = {
  installation:
    'Customers cite simple, well-documented installation more than the category norm — a strong usability signal.',
  appearance:
    'Design and finish styling resonate above category average, pulling premium perception.',
  finish:
    'Finish quality (chrome, brushed, matte) is called out favorably versus peers.',
  quality:
    'Build quality and sturdiness register above the category, reinforcing a premium read.',
  value:
    'Value-for-money sentiment runs ahead of category, broadening price-sensitive appeal.',
  durability:
    'Durability and reliability mentions outpace the category, signalling long-term trust.',
  packaging:
    'Packaging and fulfilment experience skews positive relative to peers.',
  service:
    'Service, warranty and support experience index above the category average.',
}

/** Top-N drivers for the focus brand, ranked by share, with real deltas + copy. */
export function topDriverInsights(
  drivers: DriverDatum[],
  limit = 5,
): { driver: DriverDatum; body: string }[] {
  return [...drivers]
    .sort((a, b) => b.brandShare - a.brandShare)
    .slice(0, limit)
    .map((driver) => ({ driver, body: DRIVER_COPY[driver.key] }))
}

export function buildOpportunities(ctx: InsightContext): AiInsight[] {
  const { focus, category, peer, drivers, growthFocus, growthCategory } = ctx
  const sorted = [...drivers].sort((a, b) => b.delta - a.delta)
  const strongest = sorted[0]

  return [
    {
      title: 'Improve Verified Rating',
      body: `Close the verified-experience gap with ${topPeer(ctx.competitorNames)} to lift shopper trust.`,
      metric: `${formatSignedRating(focus.verifiedRating - peer.verifiedRating)} vs peer avg`,
      tone: 'positive',
    },
    {
      title: 'Reduce Negative Review Rate',
      body: 'Address the drivers behind 1–2★ reviews to match or beat category complaint levels.',
      metric: `${pts(focus.negativeRate - category.negativeRate)} vs category`,
      tone: 'positive',
    },
    {
      title: `Grow ${strongest.label} Mentions`,
      body: `${ctx.brand} already over-indexes here — leaning in widens the perception lead.`,
      metric: `${pts(strongest.delta)} vs category`,
      tone: 'positive',
    },
    {
      title: 'Increase Recommendation Rate',
      body: 'Lift the share of reviewers who would recommend to compound word-of-mouth.',
      metric: `${pts(focus.recommendRate - category.recommendRate)} vs category`,
      tone: 'positive',
    },
    {
      title: 'Strengthen Review Growth',
      body: 'Sustain review-acquisition momentum to keep outpacing the category trend.',
      metric: `${formatSignedPoints((growthFocus.value - growthCategory.value) * 100)}pp vs category`,
      tone: 'positive',
    },
  ]
}

export function buildThreats(ctx: InsightContext): AiInsight[] {
  const { focus, category, peer, drivers } = ctx
  const weakest = [...drivers].sort((a, b) => a.delta - b.delta)[0]

  return [
    {
      title: 'Higher Negative Review Rate',
      body: `1–2★ share sits above the category — a drag on the blended star rating.`,
      metric: `${pts(focus.negativeRate - category.negativeRate)} vs category`,
      tone: 'danger',
    },
    {
      title: 'Verified Rating Behind Peers',
      body: `Verified-purchase reviews rate below ${topPeer(ctx.competitorNames)}, softening trust signals.`,
      metric: `${formatSignedRating(focus.verifiedRating - peer.verifiedRating)} vs peer avg`,
      tone: 'danger',
    },
    {
      title: `Weaker ${weakest.label} Perception`,
      body: `${ctx.brand} under-indexes on ${weakest.label.toLowerCase()} relative to the category.`,
      metric: `${pts(weakest.delta)} vs category`,
      tone: 'danger',
    },
    {
      title: 'Recommendation Rate Below Category',
      body: 'A softer recommendation rate limits organic advocacy versus peers.',
      metric: `${pts(focus.recommendRate - category.recommendRate)} vs category`,
      tone: 'danger',
    },
    {
      title: 'Unverified Complaint Pressure',
      body: 'Watch 1–2★ reviews among unverified reviewers for seeding or off-platform noise.',
      metric: `${formatPercent(focus.unverifiedComplaintRate, 1)} of unverified`,
      tone: 'danger',
    },
  ]
}

export function buildExecInsights(ctx: InsightContext): AiInsight[] {
  const { brand, focus, category, peer, growthFocus, growthCategory, drivers } = ctx
  const strongest = [...drivers].sort((a, b) => b.delta - a.delta)[0]

  return [
    {
      title: 'Rating vs Category',
      body: `${brand} ${focus.avgRating >= category.avgRating ? 'outperforms' : 'trails'} the category average on rating while holding meaningful review volume.`,
      metric: `${formatSignedRating(focus.avgRating - category.avgRating)}★ vs category`,
      tone: focus.avgRating >= category.avgRating ? 'positive' : 'warning',
    },
    {
      title: 'Driver Advantage',
      body: `Leads peers on ${strongest.label} but should defend its verified-rating position.`,
      metric: `${pts(strongest.delta)} ${strongest.short}`,
      tone: 'brand',
    },
    {
      title: 'Complaint Pressure',
      body: `Negative-review rate is ${focus.negativeRate >= category.negativeRate ? 'above' : 'below'} category — a lever on the visible star rating.`,
      metric: `${pts(focus.negativeRate - category.negativeRate)} vs category`,
      tone: focus.negativeRate >= category.negativeRate ? 'warning' : 'positive',
    },
    {
      title: 'Verified Gap Opportunity',
      body: `Room to close the verified-rating gap with top competitors to strengthen the competitive position.`,
      metric: `${formatSignedRating(focus.verifiedRating - peer.verifiedRating)} vs peers`,
      tone: 'external',
    },
    {
      title: 'Review Growth',
      body: `Review growth ${growthFocus.value >= growthCategory.value ? 'runs ahead of' : 'lags'} the category trend, a read on customer engagement.`,
      metric: `${formatSignedPoints(growthFocus.value * 100)}% YoY · ${formatSignedPoints((growthFocus.value - growthCategory.value) * 100)}pp vs cat`,
      tone: growthFocus.value >= growthCategory.value ? 'positive' : 'warning',
    },
  ]
}

/** Focus-brand review share as a one-line note (real metric). */
export function shareNote(brand: string, share: number): string {
  return `${brand} accounts for ${formatPercent(share, 1)} of category reviews in scope.`
}
