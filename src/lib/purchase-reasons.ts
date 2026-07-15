/**
 * Purchase-reason ("reason for purchase") analytics + drill-down reviews.
 *
 * WHY did the customer buy — the shopping mission (Replacement, Remodel, Upgrade,
 * …) — a different lens from Customer Driver (what they value). The reference
 * dashboard showed this as "Purchase Reason Overview / Heatmap".
 *
 * DATA STATUS: the shipped cube has no purchase-reason field and no raw review
 * text, so the per-reason shares are modelled from real cube signals (reactive
 * to brand/scope), and the drill-down "underlying reviews" are **illustrative
 * demo data**, generated deterministically per (brand × reason) so they are
 * stable. When the API starts sending real reason-tagged reviews, swap
 * `generateReasonReviews` for the real feed and the UI is unchanged.
 */

import type { Aggregate, Cell, CubePayload } from '@/types'
import { accumulate } from './analytics'
import { driverMix } from './drivers'
import { DRIVER_THEMES, type DriverKey } from './theme-detection'
import { clamp } from './format'

export type PurchaseReasonKey =
  | 'replacement'
  | 'remodel'
  | 'upgrade'
  | 'design'
  | 'price'
  | 'rental'
  | 'emergency'
  | 'loyalty'

export interface PurchaseReasonDef {
  key: PurchaseReasonKey
  label: string
  short: string
  color: string
  /** Keywords highlighted in the underlying reviews for this reason. */
  keywords: string[]
  /** Illustrative review bodies that read as this purchase reason. */
  templates: { title: string; text: string }[]
}

export interface PurchaseReasonDatum {
  key: PurchaseReasonKey
  label: string
  short: string
  color: string
  share: number
  count: number
  delta: number
  index: number
}

export interface DemoReview {
  id: string
  reviewer: string
  rating: number
  date: string
  verified: boolean
  source: string
  title: string
  text: string
}

export const PURCHASE_REASONS: PurchaseReasonDef[] = [
  {
    key: 'replacement',
    label: 'Replacement',
    short: 'Replace',
    color: '#3b9dd6',
    keywords: ['replace', 'replaced', 'replacing', 'old one', 'broke', 'worn out', 'stopped working', 'needed a new'],
    templates: [
      { title: 'Direct replacement, no fuss', text: 'Our old one finally broke after years of use, so I needed a replacement fast. This was a direct swap and works great.' },
      { title: 'Replaced the worn out unit', text: 'The previous one was worn out and starting to leak. Replaced it with this and it looks brand new.' },
      { title: 'Old one stopped working', text: 'The old one stopped working and I needed a new one right away. Easy to replace, fit perfectly.' },
      { title: 'Simple swap', text: 'Needed a new one after the old one broke. Replacing it took twenty minutes and it feels solid.' },
      { title: 'Good replacement choice', text: 'Replaced a 10-year-old fixture that was worn out. Happy with how this one turned out.' },
      { title: 'Exactly what I needed', text: 'Was just looking to replace the broken one with something reliable. This did the job.' },
    ],
  },
  {
    key: 'remodel',
    label: 'Remodel / Renovation',
    short: 'Remodel',
    color: '#a78bda',
    keywords: ['remodel', 'renovation', 'renovating', 'redo', 'makeover', 'new bathroom', 'bathroom project', 'update the'],
    templates: [
      { title: 'Perfect for our remodel', text: 'We are doing a full bathroom remodel and needed everything to match. This fit the renovation perfectly.' },
      { title: 'Bathroom renovation win', text: 'Part of a bigger renovation project. It pulled the whole new bathroom together nicely.' },
      { title: 'Redoing the guest bath', text: 'Redoing the guest bathroom and wanted a cohesive look. This was exactly the style for the makeover.' },
      { title: 'Great for a makeover', text: 'Updating the whole space as part of a remodel. Quality feels right for a renovation.' },
      { title: 'Matched our new build', text: 'Renovating a master bath — ordered several of these to update the entire room. Looks fantastic.' },
      { title: 'Renovation-grade', text: 'Bought for a bathroom project. Solid enough for a full remodel, not a cheap builder-grade feel.' },
    ],
  },
  {
    key: 'upgrade',
    label: 'Upgrade',
    short: 'Upgrade',
    color: '#2dd0bd',
    keywords: ['upgrade', 'upgraded', 'upgrading', 'better', 'higher end', 'step up', 'premium', 'nicer'],
    templates: [
      { title: 'Nice step up', text: 'Wanted to upgrade from the basic builder fixture. This is a clear step up — feels more premium.' },
      { title: 'Worth the upgrade', text: 'Upgrading from a cheaper model. So much nicer, and it looks higher end than the price suggests.' },
      { title: 'Better than the old one', text: 'Decided to upgrade and I am glad I did. Noticeably better quality than what we had.' },
      { title: 'Premium feel', text: 'This was an upgrade for us and it shows. Heavier, smoother, just nicer overall.' },
      { title: 'Glad I upgraded', text: 'Went for the higher end option to upgrade the room. Zero regrets, feels premium.' },
      { title: 'A real improvement', text: 'Upgraded from a flimsy one. This is better in every way.' },
    ],
  },
  {
    key: 'design',
    label: 'Design / Finish',
    short: 'Design',
    color: '#4bb47c',
    keywords: ['design', 'finish', 'style', 'look', 'matches', 'matte black', 'brushed nickel', 'modern', 'aesthetic'],
    templates: [
      { title: 'Love the finish', text: 'Bought this purely for the design. The matte black finish looks modern and matches everything.' },
      { title: 'Beautiful style', text: 'The style sold me. Brushed nickel finish is gorgeous and looks more expensive than it was.' },
      { title: 'Matches perfectly', text: 'Picked it for the look — it matches the rest of our fixtures and the finish is flawless.' },
      { title: 'Modern and clean', text: 'The design is exactly the modern aesthetic we wanted. Finish is smooth and even.' },
      { title: 'Aesthetic win', text: 'Chose this for the finish and I am so happy. The style really elevates the space.' },
      { title: 'Great looking', text: 'Design was the deciding factor. Looks fantastic, finish has held up beautifully.' },
    ],
  },
  {
    key: 'price',
    label: 'Price / Sale',
    short: 'Price',
    color: '#d99a3a',
    keywords: ['price', 'sale', 'deal', 'discount', 'affordable', 'budget', 'value', 'on sale'],
    templates: [
      { title: 'Great deal', text: 'Caught it on sale and could not pass up the price. Great value for what you get.' },
      { title: 'Budget friendly', text: 'On a budget for this project and this was the affordable option. Works well for the price.' },
      { title: 'Good value', text: 'The price was right and it does not feel cheap. Solid value, glad I grabbed the deal.' },
      { title: 'Worth every penny', text: 'Bought it on discount. For the price this is honestly a steal.' },
      { title: 'Affordable and works', text: 'Needed something affordable. Not fancy but does the job and the price was unbeatable.' },
      { title: 'Sale price sold me', text: 'Would not have paid full price, but on sale it was an easy yes. Happy with the value.' },
    ],
  },
  {
    key: 'rental',
    label: 'Rental / Property',
    short: 'Rental',
    color: '#7c8aa5',
    keywords: ['rental', 'rental property', 'tenant', 'landlord', 'airbnb', 'property', 'units', 'apartment'],
    templates: [
      { title: 'Perfect for rentals', text: 'I manage a few rental properties and needed something durable and cheap enough to buy in bulk. Ideal.' },
      { title: 'Landlord approved', text: 'Outfitting a rental unit. Tenants will not baby it, so I needed sturdy and simple. This fits.' },
      { title: 'Bought for my units', text: 'Ordered several for my apartment units. Easy to install and looks decent for the price.' },
      { title: 'Airbnb ready', text: 'Furnishing an Airbnb and wanted something that looks nice but is not precious. Works great.' },
      { title: 'Good for property managers', text: 'For a rental property you want reliable and replaceable. This checks both boxes.' },
      { title: 'Bulk buy for tenants', text: 'Bought a batch for my rentals. Consistent quality across all of them.' },
    ],
  },
  {
    key: 'emergency',
    label: 'Emergency Repair',
    short: 'Emergency',
    color: '#dd6070',
    keywords: ['emergency', 'urgent', 'leaking', 'flooded', 'right away', 'asap', 'same day', 'broke and needed'],
    templates: [
      { title: 'Needed it ASAP', text: 'Old one was leaking everywhere — an emergency. Grabbed this same day and it stopped the problem.' },
      { title: 'Urgent fix', text: 'Woke up to a flooded floor. Needed an urgent replacement and this was in stock. Lifesaver.' },
      { title: 'Saved the day', text: 'It broke and I needed a fix right away before more water damage. Installed it fast.' },
      { title: 'In-stock when I needed it', text: 'Emergency situation with a leak. Picked this up ASAP and it did the job under pressure.' },
      { title: 'Quick emergency swap', text: 'Urgent leak repair. Not much time to shop — this worked and installed quickly.' },
      { title: 'Handled the crisis', text: 'Had to replace a broken unit same day. Glad this was available; solved the emergency.' },
    ],
  },
  {
    key: 'loyalty',
    label: 'Brand Loyalty',
    short: 'Loyalty',
    color: '#c76fa0',
    keywords: ['always buy', 'loyal', 'trust the brand', 'third one', 'bought before', 'stick with', 'never disappoints', 'brand i trust'],
    templates: [
      { title: 'Always buy this brand', text: 'I always buy this brand — never disappoints. This is my third one and they all held up.' },
      { title: 'Brand I trust', text: 'Stick with this brand for a reason. Bought before, trust the quality, bought again.' },
      { title: 'Loyal customer', text: 'Been loyal to this brand for years. Consistent quality every time, which is why I came back.' },
      { title: 'Would not switch', text: 'Have bought several of these over the years. No reason to switch — the brand delivers.' },
      { title: 'Repeat buyer', text: 'My third purchase from this brand. I trust it and it never lets me down.' },
      { title: 'Reliable every time', text: 'I stick with this brand because it is reliable. Bought before and will buy again.' },
    ],
  },
]

const REASON_BY_KEY: Record<PurchaseReasonKey, PurchaseReasonDef> = Object.fromEntries(
  PURCHASE_REASONS.map((r) => [r.key, r]),
) as Record<PurchaseReasonKey, PurchaseReasonDef>

/** Category-typical prior for each reason (canonical order), sums to 1. */
const PRIOR = [0.32, 0.19, 0.13, 0.11, 0.09, 0.05, 0.06, 0.05]

/** Deterministic seeded RNG (mulberry32) — stable demo output per seed. */
function seededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/**
 * Purchase-reason distribution (8 shares summing to 1) for an aggregate.
 * Blends the category prior with real cube signals (rating shape, verification)
 * and a per-brand deterministic jitter, so brands differ and the mix reacts to
 * scope. Modelled — not a raw field (see file header).
 */
export function purchaseReasonShares(agg: Aggregate, seed: string): number[] {
  const n = agg.reviews || 1
  const neg = (agg.stars[0] + agg.stars[1]) / n
  const five = agg.stars[4] / n
  const verified = agg.verified / n
  const rng = seededRng(seed)

  const signal = [
    0, // replacement
    five - 0.5, // remodel ← satisfaction / aesthetic
    verified - 0.6, // upgrade
    five - 0.5, // design
    -(five - 0.5), // price ← value shoppers
    0, // rental
    neg, // emergency ← urgency / complaints
    verified - 0.6, // loyalty
  ]

  const raw = PRIOR.map((p, i) =>
    p * clamp(1 + 0.45 * signal[i] + 0.35 * (rng() - 0.5), 0.4, 1.9),
  )
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((r) => r / sum)
}

function brandAgg(scoped: Cell[], brandIdx: number): Aggregate {
  return accumulate(brandIdx < 0 ? scoped : scoped.filter((c) => c.b === brandIdx))
}

/** Focus vs. category purchase-reason overview for the donut + legend. */
export function purchaseReasonOverview(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
): { total: number; reasons: PurchaseReasonDatum[] } {
  const focusIdx = dict.brands.indexOf(focusBrand)
  const focusAgg = brandAgg(scoped, focusIdx)
  const brandShares = purchaseReasonShares(focusAgg, focusBrand)
  const catShares = purchaseReasonShares(accumulate(scoped), '__category__')
  const total = focusAgg.reviews

  const reasons: PurchaseReasonDatum[] = PURCHASE_REASONS.map((r, i) => ({
    key: r.key,
    label: r.label,
    short: r.short,
    color: r.color,
    share: brandShares[i],
    count: Math.round(brandShares[i] * total),
    delta: brandShares[i] - catShares[i],
    index: i,
  }))
  return { total, reasons }
}

export interface ReasonHeatCell {
  value: number
  delta: number
}
export interface ReasonHeatRow {
  brand: string
  isFocus: boolean
  isCategory: boolean
  /** Total reviews for this brand in scope (for the drill count). */
  total: number
  cells: ReasonHeatCell[]
}

/** Heatmap rows: focus, competitors, and category baseline (brand × reason). */
export function purchaseReasonHeatmap(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
  competitorIdxs: number[],
): ReasonHeatRow[] {
  const focusIdx = dict.brands.indexOf(focusBrand)
  const catAgg = accumulate(scoped)
  const catShares = purchaseReasonShares(catAgg, '__category__')
  const row = (brandIdx: number): ReasonHeatRow => {
    const agg = brandAgg(scoped, brandIdx)
    const shares = purchaseReasonShares(agg, dict.brands[brandIdx])
    return {
      brand: dict.brands[brandIdx],
      isFocus: brandIdx === focusIdx,
      isCategory: false,
      total: agg.reviews,
      cells: shares.map((s, i) => ({ value: s, delta: s - catShares[i] })),
    }
  }
  const rows: ReasonHeatRow[] = []
  if (focusIdx >= 0) rows.push(row(focusIdx))
  for (const idx of competitorIdxs) rows.push(row(idx))
  rows.push({
    brand: 'Category Avg',
    isFocus: false,
    isCategory: true,
    total: catAgg.reviews,
    cells: catShares.map((v) => ({ value: v, delta: 0 })),
  })
  return rows
}

const REVIEWERS = [
  'Mike D.', 'Sarah K.', 'James P.', 'Linda R.', 'Robert T.', 'Emily S.',
  'David M.', 'Jennifer W.', 'Chris B.', 'Amanda L.', 'Kevin H.', 'Michelle G.',
  'Brian C.', 'Nicole F.', 'Daniel A.', 'Rachel V.', 'Steven O.', 'Ashley N.',
  'Paul G.', 'Megan T.', 'Greg W.', 'Karen B.', 'Tom H.', 'Diana R.',
]

function weightedRating(rng: () => number, negBias: number): number {
  // negBias 0..1 shifts the distribution toward lower ratings.
  const r = rng() + negBias * 0.25
  if (r < 0.5) return 5
  if (r < 0.78) return 4
  if (r < 0.9) return 3
  if (r < 0.97) return 2
  return 1
}

const pad = (n: number) => String(n).padStart(2, '0')

const DRIVER_BY_KEY: Record<DriverKey, (typeof DRIVER_THEMES)[number]> = Object.fromEntries(
  DRIVER_THEMES.map((t) => [t.key, t]),
) as Record<DriverKey, (typeof DRIVER_THEMES)[number]>

/** Driver-flavoured sentences (with each driver's keywords) appended to a reason
 *  review so a reason×driver cell reads about BOTH. */
const DRIVER_PHRASES: Record<DriverKey, string[]> = {
  installation: [
    'Install was quick and the instructions were clear.',
    'Went in easily — simple to install, fit perfectly.',
    'Setup took minutes; mounted with no trouble.',
  ],
  appearance: [
    'It looks fantastic — really modern and sleek.',
    'The design is beautiful and matches everything.',
    'Great looking; the style really stands out.',
  ],
  finish: [
    'The finish is smooth and flawless.',
    'Love the brushed nickel finish, very even.',
    'Chrome finish looks premium and consistent.',
  ],
  quality: [
    'Feels solid and well made, very sturdy.',
    'Build quality is excellent — premium construction.',
    'No flimsy parts; quality feels high end.',
  ],
  value: [
    'Great value for the price, does not feel cheap.',
    'Affordable and worth every penny.',
    'Solid deal — the price was hard to beat.',
  ],
  durability: [
    'Feels durable and built to last for years.',
    'Reliable and heavy duty so far.',
    'Sturdy enough that I expect it to last.',
  ],
  packaging: [
    'Arrived well packaged and undamaged.',
    'Shipped fast and packed carefully.',
    'Box arrived in perfect condition.',
  ],
  service: [
    'Customer service was helpful with my question.',
    'Warranty support was easy to reach.',
    'Support was responsive and sorted it out.',
  ],
}

/** Optional closers appended for variety (so more than N templates are distinct). */
const CLOSERS = [
  '',
  'Would buy again.',
  'Highly recommend it.',
  'No complaints so far.',
  'Very happy with the purchase.',
  'Does exactly what I needed.',
  'Great experience overall.',
]

/** Which keywords to highlight in the drill-down: the driver's when a cell
 *  (reason×driver) is opened, otherwise the reason's. */
export function cellKeywords(
  reasonKey: PurchaseReasonKey,
  driverKey: DriverKey | null,
): string[] {
  return driverKey ? DRIVER_BY_KEY[driverKey].keywords : REASON_BY_KEY[reasonKey].keywords
}

/**
 * Illustrative underlying reviews for a (brand × reason [× driver]), generated
 * deterministically so they stay stable and DISTINCT per cell. When a driver is
 * given, each review appends a driver-specific sentence. Replace with the real
 * reason-tagged feed when the API provides it.
 */
export function generateReviews(
  reasonKey: PurchaseReasonKey,
  driverKey: DriverKey | null,
  brand: string,
  count = 12,
): DemoReview[] {
  const reason = REASON_BY_KEY[reasonKey]
  const rng = seededRng(`${brand}::${reasonKey}::${driverKey ?? 'all'}`)
  const negBias = reasonKey === 'emergency' ? 0.5 : reasonKey === 'replacement' ? 0.2 : 0
  const phrases = driverKey ? DRIVER_PHRASES[driverKey] : null
  const maxDistinct = reason.templates.length * (phrases?.length ?? 1) * CLOSERS.length
  const target = Math.min(count, maxDistinct)
  // cycle through shuffled templates, pairing distinct phrase/closer combos
  const order = reason.templates.map((_, i) => i).sort(() => rng() - 0.5)

  const seen = new Set<string>()
  const reviews: DemoReview[] = []
  for (let i = 0, guard = 0; reviews.length < target && guard < target * 10; i++, guard++) {
    const tplIdx = order[i % order.length]
    const phrase = phrases ? phrases[Math.floor(rng() * phrases.length)] : null
    const closer = CLOSERS[Math.floor(rng() * CLOSERS.length)]
    const key = `${tplIdx}|${phrase ?? ''}|${closer}`
    if (seen.has(key)) continue
    seen.add(key)

    const tpl = reason.templates[tplIdx]
    const parts = [tpl.text]
    if (phrase) parts.push(phrase)
    if (closer) parts.push(closer)
    const year = 2023 + Math.floor(rng() * 3)
    const month = 1 + Math.floor(rng() * 12)
    const day = 1 + Math.floor(rng() * 27)
    reviews.push({
      id: `${reasonKey}-${driverKey ?? 'all'}-${brand}-${reviews.length}`,
      reviewer: REVIEWERS[Math.floor(rng() * REVIEWERS.length)],
      rating: weightedRating(rng, negBias),
      date: `${year}-${pad(month)}-${pad(day)}`,
      verified: rng() > 0.18,
      source: rng() > 0.12 ? 'Home Depot' : 'HomeDepot.ca',
      title: tpl.title,
      text: parts.join(' '),
    })
  }
  return reviews.sort((a, b) => b.date.localeCompare(a.date))
}

/** A drill target: a purchase reason, optionally paired with a customer driver,
 *  and optionally a specific brand (for the competitor view). */
export interface ReasonDriverTarget {
  reason: PurchaseReasonDatum
  driverKey?: DriverKey
  driverLabel?: string
  brand?: string
}

/* ------------------------------------------------------------------ */
/*  Reason × Driver comparison matrix                                  */
/* ------------------------------------------------------------------ */

/**
 * Base affinity of each purchase reason (row) for each customer driver (column,
 * in DRIVER_THEMES order: install, appearance, finish, quality, value,
 * durability, packaging, service). Modelled/illustrative — this is the
 * "why they bought → what they value" relationship, blended lightly with the
 * focus brand's real driver mix so it reacts to the brand.
 */
const AFFINITY: Record<PurchaseReasonKey, number[]> = {
  replacement: [3, 1, 1, 3, 2, 3, 1, 1],
  remodel: [1, 4, 4, 2, 1, 1, 1, 1],
  upgrade: [1, 3, 3, 4, 1, 2, 1, 1],
  design: [1, 5, 4, 2, 1, 1, 1, 1],
  price: [2, 1, 1, 1, 5, 1, 1, 1],
  rental: [3, 1, 1, 2, 4, 3, 1, 1],
  emergency: [4, 1, 1, 2, 1, 4, 1, 2],
  loyalty: [2, 2, 2, 4, 1, 2, 1, 3],
}

export interface ReasonDriverCell {
  value: number
  delta: number
}
export interface ReasonDriverRow {
  key: PurchaseReasonKey
  label: string
  short: string
  color: string
  cells: ReasonDriverCell[]
}

/** Column headers for the matrix (customer drivers). */
export const DRIVER_COLUMNS = DRIVER_THEMES.map((t) => ({
  key: t.key,
  short: t.short,
  label: t.label,
}))

/**
 * Reason × Driver matrix: each row is a purchase reason, each cell is the share
 * of that reason's buyers who over-index on a driver. `delta` is vs. the
 * average across reasons (drives the green/red tint = "over-indexes here").
 */
export function reasonDriverMatrix(
  scoped: Cell[],
  dict: CubePayload['dict'],
  focusBrand: string,
): ReasonDriverRow[] {
  const focusIdx = dict.brands.indexOf(focusBrand)
  const brandMix = driverMix(
    accumulate(focusIdx < 0 ? scoped : scoped.filter((c) => c.b === focusIdx)),
  )
  const avg = 1 / DRIVER_THEMES.length

  const dists = PURCHASE_REASONS.map((r) => {
    const raw = AFFINITY[r.key].map((w, di) =>
      w * clamp(1 + 0.5 * ((brandMix[di] - avg) / avg), 0.3, 2),
    )
    const sum = raw.reduce((a, b) => a + b, 0) || 1
    return raw.map((x) => x / sum)
  })
  const baseline = DRIVER_THEMES.map(
    (_, di) => dists.reduce((a, d) => a + d[di], 0) / dists.length,
  )

  return PURCHASE_REASONS.map((r, ri) => ({
    key: r.key,
    label: r.label,
    short: r.short,
    color: r.color,
    cells: dists[ri].map((v, di) => ({ value: v, delta: v - baseline[di] })),
  }))
}
