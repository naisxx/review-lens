# Review Lens

An enterprise **review-authenticity analytics dashboard**. Review Lens analyzes ~75,800 Home Depot bath-hardware product reviews and scores how *authentic* a brand's review base is — native (on-site) vs. syndicated source mix, verified-purchase strength, unverified-complaint pressure, and the rating lift or drag that external sources apply.

It recreates the density, hierarchy and polish of a premium BI dashboard (think Power BI / Grafana / Linear) on a dark, data-terminal theme, and every real metric is derived live from the supplied dataset.

![Overview](.netlify/assets/6a4fbfafde5ef1b028e23c51/image.png)

## Highlights

- **Six executive KPIs** — Authenticity Score, Native/Real Share, Verified Purchase Rate, Unverified Complaint Rate, External Rating Lift/Drag, Review Volume — each with live deltas vs. a selectable benchmark and a subtle count-up.
- **Interactive visualizations** — per-brand authenticity table (sortable), 100%-stacked source-mix bars, an authenticity positioning bubble map, a source-composition donut with detail list, and a volume/rating trend.
- **Global filters that fan out** — Brand Focus, Subcategory, Region, Time Period and Benchmark update every real visualization reactively.
- **AI insight panels** — Opportunities, Threats and Executive Takeaways, clearly badged as AI and intentionally static.

## Tech stack

TanStack Start (React 19) · TypeScript (strict) · Vite 7 · Tailwind CSS 4 · Radix UI · Recharts · TanStack Table · Framer Motion · Lucide · deployed on Netlify.

## How the data works

The raw corpus (~85 MB across 11 JSON files) is pre-aggregated **once, at authoring time**, into a compact OLAP cube — `src/data/cube.json` (~0.5 MB, ~86 KB gzipped, 9,103 cells) at the grain **(brand × subcategory × region × month)**. The cube is served through a TanStack server function and loaded once; all filtering and metric derivation then happen instantly on the client. No raw reviews are shipped to the browser and no values are hardcoded. See `AGENTS.md` for the full architecture.

## Run locally

```bash
npm install
npm run dev
# → http://localhost:3000

# or, with Netlify feature emulation:
netlify dev --port 8889
```

Build for production (also run automatically by the Netlify pipeline):

```bash
npm run build
```

## Project layout

```
src/
├── data/cube.json          # pre-aggregated analytics cube
├── lib/analytics.ts        # metric-derivation engine + selectors
├── hooks/useAnalytics.ts   # memoized view-model for the whole dashboard
├── components/
│   ├── ui/                 # shadcn-style primitives
│   ├── layout/             # sidebar, topbar, filter bar, shell
│   ├── charts/             # Recharts components
│   └── dashboard/          # KPIs, table, insights, gaps, takeaways
└── routes/                 # __root.tsx, index.tsx (Overview)
```
