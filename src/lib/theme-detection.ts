/**
 * Customer-driver & pain-point theme detection.
 *
 * These are REAL, deterministic keyword matchers over free review text
 * (`ReviewText`, `ReviewTitle`, `CustomerSentimentLike/DontLike`). They are the
 * source of truth for theme mining **when raw review text is available**.
 *
 * NOTE ON THE SHIPPED DATASET: ReviewLens ships a pre-aggregated OLAP cube
 * (`src/data/cube.json`) that stores counts/sums per (brand × subcategory ×
 * region × month) and intentionally contains **no raw review text** (the raw
 * corpus is ~85 MB and never sent to the browser — see AGENTS.md). Because of
 * that, the live dashboard derives its driver mix from real aggregate signals
 * (see `src/lib/drivers.ts`). This module is the drop-in text miner: point
 * `detectThemes` at the raw corpus during cube regeneration to fold real theme
 * counts into the cube, and every driver view will read them verbatim.
 */

export type DriverKey =
  | 'installation'
  | 'appearance'
  | 'finish'
  | 'quality'
  | 'value'
  | 'durability'
  | 'packaging'
  | 'service'

export type PainKey =
  | 'leaks'
  | 'finishProblems'
  | 'missingBroken'
  | 'installIssues'
  | 'shipping'
  | 'durabilityIssues'
  | 'serviceIssues'

export interface ThemeDef<K extends string> {
  key: K
  label: string
  short: string
  keywords: string[]
}

/** Positive customer-driver themes (order is the canonical column order). */
export const DRIVER_THEMES: ThemeDef<DriverKey>[] = [
  {
    key: 'installation',
    label: 'Easy Installation',
    short: 'Install',
    keywords: [
      'install', 'installation', 'easy to install', 'simple', 'setup',
      'instructions', 'fit', 'fits', 'mounted',
    ],
  },
  {
    key: 'appearance',
    label: 'Appearance / Design',
    short: 'Appearance',
    keywords: [
      'look', 'looks', 'design', 'style', 'beautiful', 'sleek', 'modern',
      'appearance', 'aesthetic',
    ],
  },
  {
    key: 'finish',
    label: 'Finish Quality',
    short: 'Finish',
    keywords: [
      'finish', 'chrome', 'matte', 'brushed', 'nickel', 'color', 'coating',
      'polished', 'stainless',
    ],
  },
  {
    key: 'quality',
    label: 'Product Quality',
    short: 'Quality',
    keywords: [
      'quality', 'sturdy', 'solid', 'well made', 'premium', 'build',
      'construction',
    ],
  },
  {
    key: 'value',
    label: 'Value / Price',
    short: 'Value',
    keywords: ['price', 'value', 'affordable', 'worth', 'deal', 'cost', 'inexpensive'],
  },
  {
    key: 'durability',
    label: 'Durability',
    short: 'Durability',
    keywords: ['durable', 'lasts', 'long lasting', 'strong', 'reliable', 'heavy duty'],
  },
  {
    key: 'packaging',
    label: 'Packaging',
    short: 'Packaging',
    keywords: ['packaging', 'packed', 'box', 'shipped', 'shipping', 'delivered'],
  },
  {
    key: 'service',
    label: 'Customer Service',
    short: 'Service',
    keywords: ['service', 'support', 'warranty', 'replacement', 'help', 'customer care'],
  },
]

/** Negative pain-point themes. */
export const PAIN_THEMES: ThemeDef<PainKey>[] = [
  {
    key: 'leaks',
    label: 'Leaks / Water Issues',
    short: 'Leaks',
    keywords: ['leak', 'leaking', 'drip', 'dripping', 'water pressure', 'flow issue'],
  },
  {
    key: 'finishProblems',
    label: 'Finish Problems',
    short: 'Finish',
    keywords: ['rust', 'stain', 'peeling', 'scratch', 'scratched', 'discolor', 'tarnish'],
  },
  {
    key: 'missingBroken',
    label: 'Missing / Broken Parts',
    short: 'Missing/Broken',
    keywords: ['missing', 'broken', 'damaged', 'cracked', 'defective', 'parts'],
  },
  {
    key: 'installIssues',
    label: 'Installation Issues',
    short: 'Install',
    keywords: [
      'hard to install', 'difficult install', 'confusing instructions',
      'does not fit', 'poor fit',
    ],
  },
  {
    key: 'shipping',
    label: 'Packaging / Shipping',
    short: 'Shipping',
    keywords: ['damaged box', 'shipping damage', 'poor packaging', 'arrived damaged'],
  },
  {
    key: 'durabilityIssues',
    label: 'Durability Issues',
    short: 'Durability',
    keywords: ['broke', 'failed', 'stopped working', 'loose', 'flimsy', 'cheap'],
  },
  {
    key: 'serviceIssues',
    label: 'Customer Service Issues',
    short: 'Service',
    keywords: ['warranty denied', 'no response', 'poor support', 'return', 'refund'],
  },
]

/**
 * Case-insensitive keyword detection. Returns the set of theme keys whose
 * keywords appear in the supplied text fragments. A theme is counted at most
 * once per review regardless of how many of its keywords match.
 */
export function detectThemes<K extends string>(
  themes: ThemeDef<K>[],
  ...fragments: (string | null | undefined)[]
): Set<K> {
  const hay = fragments
    .filter((f): f is string => Boolean(f))
    .join('  ')
    .toLowerCase()
  const hits = new Set<K>()
  if (!hay.trim()) return hits
  for (const theme of themes) {
    if (theme.keywords.some((kw) => hay.includes(kw))) hits.add(theme.key)
  }
  return hits
}

export const detectDrivers = (...f: (string | null | undefined)[]) =>
  detectThemes(DRIVER_THEMES, ...f)
export const detectPains = (...f: (string | null | undefined)[]) =>
  detectThemes(PAIN_THEMES, ...f)
