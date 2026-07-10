import { useMemo } from 'react'
import {
  benchmarkMetrics,
  competitorIdxs,
  competitorRows,
  growthYoY,
  metricsForBrand,
  peerMetrics,
  scopeCells,
  shareOfCategory,
  timeWindowLabel,
  universeMetrics,
} from '@/lib/analytics'
import { driverHeatmap, driverOverview } from '@/lib/drivers'
import {
  buildExecInsights,
  buildOpportunities,
  buildThreats,
  topDriverInsights,
  type InsightContext,
} from '@/lib/ai-insights'
import { useFilters } from '@/components/providers/FilterProvider'
import type { Metrics } from '@/types'

/** Number of competitor brands benchmarked against the focus brand. */
const COMPETITORS = 4

/**
 * Central analytics selector for the executive overview. Every real
 * visualization reads from here so a single filter change fans out
 * consistently. All derivations are memoized on `(cells, filters)`.
 */
export function useAnalytics() {
  const { cells, dict, filters, meta } = useFilters()

  return useMemo(() => {
    const scoped = scopeCells({ cells, dict }, filters)
    const focusIdx = dict.brands.indexOf(filters.brand)
    const focusCells = focusIdx >= 0 ? scoped.filter((c) => c.b === focusIdx) : []

    const focus: Metrics = metricsForBrand(scoped, focusIdx)
    const category: Metrics = universeMetrics(scoped)
    const benchmark: Metrics = benchmarkMetrics(scoped, filters.benchmark)
    const peer: Metrics = peerMetrics(scoped, focusIdx, COMPETITORS)

    const compIdxs = competitorIdxs(scoped, focusIdx, COMPETITORS)
    const competitorNames = compIdxs.map((i) => dict.brands[i])

    const growthFocus = growthYoY(focusCells, dict.months)
    const growthCategory = growthYoY(scoped, dict.months)
    const share = shareOfCategory(scoped, focusIdx)

    const { total: driverTotal, drivers } = driverOverview(scoped, dict, filters.brand)
    const heatmap = driverHeatmap(scoped, dict, filters.brand, compIdxs)

    const insightCtx: InsightContext = {
      brand: filters.brand,
      competitorNames,
      focus,
      category,
      peer,
      growthFocus,
      growthCategory,
      share,
      drivers,
    }

    return {
      dict,
      meta,
      filters,
      hasData: scoped.length > 0 && focus.reviews > 0,
      focus,
      category,
      benchmark,
      peer,
      competitorNames,
      competitors: competitorRows(scoped, dict, filters.brand, COMPETITORS),
      growthFocus,
      growthCategory,
      share,
      driverTotal,
      drivers,
      heatmap,
      topDrivers: topDriverInsights(drivers),
      opportunities: buildOpportunities(insightCtx),
      threats: buildThreats(insightCtx),
      execInsights: buildExecInsights(insightCtx),
      timeLabel: timeWindowLabel(dict, filters.time),
      benchmarkLabel:
        filters.benchmark === 'category-average' ? 'Category Average' : 'Market Leaders',
    }
  }, [cells, dict, filters, meta])
}

export type AnalyticsResult = ReturnType<typeof useAnalytics>
