import { useMemo } from 'react'
import {
  accumulate,
  authenticityFactors,
  authenticitySignals,
  authenticityTrend,
  brandAuthRows,
  coverage,
  reviewerTrustMix,
  scopeCells,
  sourceDetail,
  timeWindowLabel,
} from '@/lib/analytics'
import {
  buildAuthRisks,
  buildAuthTakeaways,
  type AuthInsightContext,
} from '@/lib/ai-insights'
import { useFilters } from '@/components/providers/FilterProvider'

// Large enough to include every brand present in scope (table scrolls).
const BRAND_LIMIT = 999

/**
 * Selector for the Review Source / Authenticity page. Reads the shared filter
 * scope and derives every authenticity view model from the cube. Memoized on
 * `(cells, filters)` so it recomputes only when scope changes.
 */
export function useAuthenticity() {
  const { cells, dict, filters, meta } = useFilters()

  return useMemo(() => {
    const scoped = scopeCells({ cells, dict }, filters)
    const focusIdx = dict.brands.indexOf(filters.brand)
    const focusAgg = accumulate(focusIdx >= 0 ? scoped.filter((c) => c.b === focusIdx) : [])
    const catAgg = accumulate(scoped)

    const focus = authenticitySignals(focusAgg)
    const category = authenticitySignals(catAgg)
    const cov = coverage(scoped, dict, focusIdx)
    const trustMix = reviewerTrustMix(focusAgg)

    const ctx: AuthInsightContext = {
      brand: filters.brand,
      focus,
      category,
      coverage: cov,
      trustMix,
    }

    return {
      dict,
      meta,
      filters,
      hasData: scoped.length > 0 && focus.reviews > 0,
      focus,
      category,
      coverage: cov,
      factors: authenticityFactors(focus, category),
      trustMix,
      trustTotal: focusAgg.reviews,
      sources: sourceDetail(scoped, dict, filters.brand),
      brandRows: brandAuthRows(scoped, dict, filters.brand, BRAND_LIMIT),
      authTrend: authenticityTrend(scoped, dict, focusIdx),
      takeaways: buildAuthTakeaways(ctx),
      risks: buildAuthRisks(ctx),
      timeLabel: timeWindowLabel(dict, filters.time),
    }
  }, [cells, dict, filters, meta])
}

export type AuthenticityResult = ReturnType<typeof useAuthenticity>
