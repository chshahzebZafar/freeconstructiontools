# Free Construction Tools

Free, browser-based construction calculators and estimators — [freeconstructiontools.com](https://freeconstructiontools.com).

Built with Next.js 16, React 19, and Tailwind CSS v4. No database, no auth, no API — every calculator runs entirely client-side.

## Calculators

Concrete · Lumber · Roofing · Drywall · Stairs · Roof Pitch · Flooring · Paint · Tile · Square Footage · Fence · Mulch

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

## Project structure

- `app/<slug>/` — one folder per calculator (`page.tsx` + `layout.tsx` for metadata). URLs are flat at the domain root, e.g. `/concrete-calculator`.
- `app/page.tsx` — homepage listing every calculator.
- `lib/category-tools.ts` — the calculator registry. Add a tool here and it appears on the homepage, sitemap, and related-tools sections automatically.
- `components/` — shared `Header`, `Footer`, `Breadcrumbs`, `RelatedCategoryTools`, and `ui/` primitives.

## Adding a calculator

1. Add an entry to `lib/category-tools.ts` (`path` must be `/{slug}`).
2. Create `app/{slug}/page.tsx` and `app/{slug}/layout.tsx`.

## Origin

Forked from the construction section of aisocialtools.co and rebuilt as a standalone, single-topic site.
