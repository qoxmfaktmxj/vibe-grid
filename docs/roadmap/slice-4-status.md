# Slice 4 Status

## Completed

- Added a reusable virtualization hook in `@vibe-grid/virtualization`.
- Added benchmark row generation helpers in `@vibe-grid/core`.
- Replaced the bench placeholder with a real virtualized surface:
  - 10k / 50k / 100k scenario switching
  - visible-range feedback
  - sticky header
  - sticky first column
  - large-row virtual scrolling
- Verified the monorepo still passes:
  - `npm run lint`
  - `npm run build`

## Manual Test URLs

- Playground: `http://localhost:3202`
- Bench: `http://localhost:3201`

## What To Check Manually

1. In `playground`, verify:
   - row selection
   - double-click inline edit
   - clipboard paste
   - xlsx template/export/import preview
   - save bundle preview
2. In `bench`, verify:
   - scenario switching between 10k / 50k / 100k
   - smooth scroll feel
   - sticky header behavior
   - sticky first column behavior
   - visible-range updates while scrolling

## Next Slice

1. Add pinned-column behavior to the main React grid surface.
2. Add Playwright automation for playground and bench smoke flows.
3. Start IBSheet compatibility scenarios in `apps/compat-lab`.
4. Add server-mode query contracts for filter/sort/pagination.
