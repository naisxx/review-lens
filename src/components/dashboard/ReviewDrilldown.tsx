import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, BadgeCheck, Store } from 'lucide-react'
import {
  cellKeywords,
  generateReviews,
  type ReasonDriverTarget,
} from '@/lib/purchase-reasons'
import { formatInt, formatPercent } from '@/lib/format'

/** Highlight the active keywords inside a review body. */
function Highlighted({ text, keywords }: { text: string; keywords: string[] }) {
  const kws = keywords.filter(Boolean)
  if (!kws.length) return <>{text}</>
  const esc = kws
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
  const splitRe = new RegExp(`(${esc.join('|')})`, 'gi')
  const testRe = new RegExp(`^(?:${esc.join('|')})$`, 'i')
  return (
    <>
      {text.split(splitRe).map((part, i) =>
        testRe.test(part) ? (
          <mark
            key={i}
            className="rounded-[3px] bg-brand/25 px-0.5 font-medium text-brand"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="tabular text-[12px] tracking-tight" aria-label={`${rating} of 5 stars`}>
      <span className="text-warning">{'★'.repeat(rating)}</span>
      <span className="text-line-strong">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

/**
 * Drill-down: the underlying reviews for a purchase reason — or a specific
 * reason × customer-driver cell — with the relevant keywords highlighted.
 * Reviews are illustrative demo data (see `purchase-reasons.ts`).
 */
export function ReviewDrilldown({
  target,
  brand,
  onClose,
}: {
  target: ReasonDriverTarget | null
  brand: string
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (target) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target, onClose])

  if (!target) return null

  const { reason, driverKey, driverLabel } = target
  const drillBrand = target.brand ?? brand
  const keywords = cellKeywords(reason.key, driverKey ?? null)
  const reviews = generateReviews(reason.key, driverKey ?? null, drillBrand, 12)
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / (reviews.length || 1)
  const verifiedShare = reviews.filter((r) => r.verified).length / (reviews.length || 1)

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl border border-line-strong bg-surface shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span
              className="mt-0.5 h-8 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: reason.color }}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-semibold text-ink">
                  {reason.label}
                  {driverLabel && (
                    <span className="text-ink-muted"> · {driverLabel}</span>
                  )}
                </h2>
                <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted ring-1 ring-inset ring-line-strong">
                  {driverLabel ? 'Reason × Driver' : 'Reason for purchase'}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-ink-faint">
                <span className="font-medium text-ink-muted">{drillBrand}</span> ·{' '}
                {formatInt(reason.count)} reviews ({formatPercent(reason.share, 1)} of total)
                {driverLabel && ` · buyers who valued ${driverLabel.toLowerCase()}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-ink-faint outline-none transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Highlights bar */}
        <div className="border-b border-line bg-surface-2/40 px-5 py-2.5">
          <div className="mb-1.5 flex items-center gap-3 text-[11px] text-ink-faint">
            <span>
              Avg <span className="tabular font-semibold text-ink">{avg.toFixed(1)}★</span>
            </span>
            <span className="text-line-strong">·</span>
            <span>
              <span className="tabular font-semibold text-ink">{formatPercent(verifiedShare, 0)}</span>{' '}
              verified
            </span>
            <span className="text-line-strong">·</span>
            <span className="text-[10px] uppercase tracking-wide">
              {driverLabel ? `${driverLabel} highlights` : 'Highlights'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 6).map((k) => (
              <span
                key={k}
                className="rounded-full bg-brand/12 px-2 py-0.5 text-[10.5px] font-medium text-brand ring-1 ring-inset ring-brand/25"
              >
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-line bg-surface-2/40 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-[12.5px] font-semibold text-ink">{r.title}</span>
                </div>
                <span className="shrink-0 text-[10.5px] tabular text-ink-faint">{r.date}</span>
              </div>
              <p className="text-[12.5px] leading-snug text-ink-muted">
                <Highlighted text={r.text} keywords={keywords} />
              </p>
              <div className="mt-1.5 flex items-center gap-2.5 text-[10.5px] text-ink-faint">
                <span className="font-medium text-ink-muted">{r.reviewer}</span>
                {r.verified && (
                  <span className="flex items-center gap-0.5 text-positive">
                    <BadgeCheck className="h-3 w-3" /> Verified purchase
                  </span>
                )}
                <span className="flex items-center gap-0.5">
                  <Store className="h-3 w-3" /> {r.source}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-2.5 text-[10.5px] text-ink-faint">
          <span>
            Showing {reviews.length} of {formatInt(reason.count)} reviews
            {driverLabel ? ` mentioning ${driverLabel.toLowerCase()}` : ' for this reason'}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
