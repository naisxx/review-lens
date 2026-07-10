# AGENTS.md

Architecture and conventions for **Review Lens** — an enterprise review-authenticity analytics dashboard. Read this before making changes.

## What this is

Review Lens is a single-screen executive dashboard that analyzes ~75.8k Home Depot bath-hardware product reviews to score **review authenticity**: native (on-site) vs. syndicated source mix, verified-purchase strength, unverified-complaint pressure, and the rating lift/drag that external sources apply. It recreates the density and hierarchy of a premium BI dashboard (Power BI / Grafana / Linear feel) on a dark, data-terminal theme.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (React 19) on Netlify |
| Routing/data | TanStack Router loaders + server functions |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 (`@theme` tokens in `src/styles.css`) |
| UI primitives | Radix UI (Select, Popover, Tooltip) + custom shadcn-style wrappers |
| Charts | Recharts 2 |
| Table | TanStack Table |
| Animation | Framer Motion (count-up + fades only) |
| Icons | Lucide |
| Language | TypeScript (strict, no `any`) |

> Note: the original brief requested Next.js 15. This project was built on the Netlify **dashboard** template (TanStack Start) because it is the platform's supported, deploy-validated React stack. Every requested library is framework-agnostic and used as specified.

## The data pipeline (most important concept)

The raw corpus is **~85 MB across 11 JSON files** — far too large to ship to the browser. It is collapsed **once, at authoring time**, into a compact OLAP cube:

- `src/data/cube.json` (~0.5 MB, ~86 KB gzipped) holds **9,103 pre-aggregated cells** at the grain **(brand × subcategory × region × month)**.
- Each cell stores counts and sums (stars histogram, verified, recommended, responses, unverified-complaint crosstab, per-source counts and star-sums) — never raw reviews.
- Dictionaries (brands, subcategories, regions, sources, months) are index-encoded so cells are flat numeric tuples.

The cube is served by the `getCube` server function (`src/server/cube.functions.ts`) and loaded once in the route loader. **All filtering and metric derivation then happens client-side** over the 9k cells, which is instant and lets every filter update every real visualization reactively.

If the source data changes, regenerate `src/data/cube.json` with an aggregation script at the same grain and schema (see the `schema` array inside the file).

## Directory structure

```
src/
├── data/cube.json                 # pre-aggregated analytics cube (build-time artifact)
├── types/index.ts                 # domain types: Cube, Cell, Filters, Metrics, chart data
├── lib/
│   ├── analytics.ts               # ENGINE: decode → scope(filter) → aggregate → derive metrics + selectors
│   ├── insights.ts                # STATIC AI narrative content (opportunities/threats/takeaways)
│   ├── format.ts                  # number/percent/rating formatters
│   └── utils.ts                   # cn() classname helper
├── server/cube.functions.ts       # getCube server function
├── hooks/useAnalytics.ts          # memoized selector reading filters+cube → all view models
├── components/
│   ├── providers/FilterProvider.tsx  # global filter state (reducer) + decoded cells (context)
│   ├── ui/                        # shadcn-style primitives (card, badge, button, select,
│   │                              #   multi-select, combobox, tooltip, info-dot, count-up,
│   │                              #   skeleton, client-only)
│   ├── layout/                    # Sidebar, Topbar, FilterBar, DashboardShell
│   ├── charts/                    # SourceMixChart, PositioningMap, SourceDonut, TrendChart,
│   │                              #   chart-theme (shared palette + tooltip)
│   └── dashboard/                 # Overview (composition), KpiRow/KpiCard, AuthenticityTable,
│                                  #   InsightPanel, KeyGaps, QualitySignals, SourceDetailList,
│                                  #   ExecutiveTakeaways, SectionCard
└── routes/
    ├── __root.tsx                 # document shell, fonts (IBM Plex Sans/Mono), metadata
    └── index.tsx                  # loads cube → FilterProvider → DashboardShell → Overview
```

## Filters (real vs. static)

Global filters live in `FilterProvider` and flow through `useAnalytics`:

- **Brand Focus** — the subject brand for KPIs, donut, trend and table highlight (searchable combobox over 73 brands).
- **Subcategory / Region / Time** — scope the universe of cells (multi-select + presets).
- **Benchmark** — comparison baseline for deltas: *Category Average* or *Market Leaders* (top-5 by volume).
- **Retailer / Category** — single-value in this dataset (Home Depot / Bath Hardware), shown for completeness.

**Every real chart, KPI and the table recompute from filters.** The AI panels (`insights.ts`) — Opportunities, Threats, Executive Takeaways — are **intentionally static** and badged "AI"; do not wire them to filters.

## Derived metrics

`src/lib/analytics.ts` is the single source of truth. Key derivations:

- **Native / Real Share** = native (on-site) reviews ÷ total.
- **Verified Purchase Rate** = verified ÷ total.
- **Unverified Complaint Rate** = (unverified 1–2★) ÷ unverified.
- **External Rating Lift/Drag** = avg★(external sources) − avg★(native).
- **Authenticity Score** (0–100) = documented weighted composite of the above (weights in `authenticityScore()`); it is a *real derived* metric, not static.

## Conventions

- Components PascalCase; hooks/utils camelCase; route files kebab-case.
- Strict TypeScript, no `any`. Use `type`-only imports.
- Style with Tailwind utilities + theme tokens (`bg-surface`, `text-ink-muted`, `ring-brand/25`, …) defined in `styles.css` `@theme`. Use `cn()` for conditional classes.
- Metric numbers use the `.tabular` class (tabular-nums) so columns align.
- Charts render inside `ClientOnly` with a `Skeleton` fallback to avoid SSR/measurement mismatches.
- Keep components small and presentational; all business logic stays in `lib/analytics.ts` and `hooks/useAnalytics.ts`.

## Commands

```bash
npm run dev      # local dev (Vite) — or: netlify dev --port 8889
npm run build    # production build (run by the deploy pipeline)
```
