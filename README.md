# VibeGrid

VibeGrid is a standalone internal grid product workspace for replacing IBSheet-style business grids across EHR-related applications.

## What this repo is for

- Build a reusable business-grid product, not a page-level table widget
- Keep `TanStack Table` as an internal engine detail
- Expose a stable app-facing API for `row-first` HR workflows
- Validate IBSheet replacement behavior before broad migration into `EHR_6` and `vibe-hr`

## Workspace layout

- `apps/playground`: single-port manual test hub for grid, compatibility, and UX flows
- `apps/bench`: focused performance surface for large datasets
- `packages/core`: public contracts, row state, validation, save bundle, selection model
- `packages/react`: app-facing React surface
- `packages/tanstack-adapter`: TanStack Table bridge
- `packages/virtualization`: sticky/frozen/virtualization orchestration
- `packages/excel`: xlsx import/export/template pipeline
- `packages/clipboard`: copy/paste parsing and rectangular apply
- `packages/testing`: reusable bench and fixture helpers

## Start Here

Before changing code, read these files first:

1. `AGENTS.md`
2. `docs/adr/0001-product-scope.md`
3. `docs/development/vibe-grid-development-guide.md`
4. the latest relevant slice docs in `docs/roadmap/`

Current active references:

- `docs/roadmap/current-execution-plan.md`
- `docs/roadmap/slice-8-range-selection-design.md`
- `docs/roadmap/slice-8-status.md`
- `docs/roadmap/slice-9-productized-grid-ux-design.md`

## Local commands

```bash
npm install
npm run dev
```

Default local hub:

- `http://localhost:3203`
- `http://localhost:3203/labs/grid`
- `http://localhost:3203/labs/bench`
- `http://localhost:3203/labs/compatibility`

Validation commands:

```bash
npm run lint
npm run build
npm run ci
```

For fresh browser validation, prefer:

```powershell
$env:CI='1'; npm run test:e2e
```

UI and interaction changes must include browser validation with Playwright before push.

Here, Playwright validation means real browser click and event verification, including behavior like:

- click
- focus
- keyboard input
- paste
- drag
- sticky/pinned interaction

## Deployment shape

- Git repository target: `minseok91/vibe-grid`
- Vercel project root directory: `apps/playground`
- Custom domain target: `grid.minseok91.cloud`

Detailed deployment steps live in `docs/deployment/vercel-github-deploy.md`.

## Ground rules

- Apps should not depend on TanStack types directly.
- Public contracts belong to `@vibe-grid/core`.
- Primary UX target is IBSheet-like row-first business workflows.
- `EHR_6` remains the comparison app until VibeGrid reaches parity.
