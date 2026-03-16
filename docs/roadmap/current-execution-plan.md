# Current Execution Plan

## Purpose

This document turns the current repo state into an executable backlog.

It is based on:

- completed slices through `Slice 7`
- `Slice 8` foundation status
- `Slice 8` and `Slice 9` design docs
- the current repo shape and validation rules

## Current Truth

### Implemented

- `Slice 1` to `Slice 7` are implemented and validated.
- Grid Lab, Bench, and Compatibility surfaces exist.
- Core contracts cover row state, validation, save bundle, selection, editors, clipboard, and xlsx flows.
- Playwright browser validation is already part of the working rules and CI.

### Partially Implemented

- `P5` now has a real `VibeGrid` performance lab with row virtualization wired into the actual render path.
- `P5` also now records interaction timings for scenario switch, selection, filter, sort, and column updates.

### Not Product-Complete Yet

- real-grid performance verification under combined features
- persistence adapter productization
- theme / i18n productization
- broader regression coverage and release discipline

## Delivery Gates

### Gate A: Pilot-Ready Internal Grid

This is the minimum bar before using VibeGrid in a real business screen pilot.

Required:

- header menu MVP
- filter row MVP
- stable range selection / copy / paste
- paste validation summary
- real-grid performance pass with pinning and sticky states
- Playwright coverage for the new interaction paths

### Gate B: Standard-Ready Shared Grid

This is the bar before treating VibeGrid as a shared internal standard across multiple apps.

Required:

- persistence adapter with `user + app + gridId` scope
- theme token layer and consistent product styling
- i18n message catalog and locale strategy
- broader regression matrix
- release / versioning discipline
- migration kit and compatibility checklist

## Working Assumptions

- `TanStack Table` remains an internal engine.
- `@vibe-grid/core` remains the public behavior contract.
- row-first UX remains the default business mode
- range selection is additive, not a replacement for row workflows
- Playwright browser validation remains mandatory for UI and interaction changes

## Priority Order

### P0. Metadata and Repo Consistency

Status:

- completed on `2026-03-13`

Why first:

- repo, deployment, and slice metadata must stay aligned with the current workspace state
- roadmap and deployment metadata should not drift before more contributors touch the repo

Tasks:

- decide and document the canonical public repo target
- align `README.md` and deployment docs with the actual repo and deployment path
- check for stale slice/phase references in docs and scaffolding helpers

Acceptance:

- no contradictory repo owner or deployment references remain
- working docs point to the actual current deployment and source location

### P1. VibeGrid Runtime Decomposition

Status:

- completed on `2026-03-13`
- `VibeGrid.tsx` header rendering, body rendering, inline editor, and range/sticky utilities were split into internal modules

Why now:

- `packages/react/src/VibeGrid.tsx` is already over 1000 lines
- header menu, filter row, and range polish will make the file harder to maintain if added directly

Tasks:

- split header rendering into focused components
- split body cell rendering into focused components
- isolate selection and range interaction wiring into dedicated hooks or modules
- keep the public React surface unchanged

Suggested targets:

- `GridHeaderCell`
- `GridHeaderActions`
- `GridFilterCell`
- `GridBodyCell`
- `useGridSelectionController`
- `useGridHeaderMenu`

Acceptance:

- `VibeGrid.tsx` becomes an orchestration component instead of a full implementation file
- no behavior regression in current Grid Lab flows

Validation:

- `npm run lint`
- `npm run build`
- `CI=1 npm run test:e2e`

### P2. Slice 9A and 9B: Productized Header and Header Menu

Status:

- completed on `2026-03-13`
- header menu MVP now covers sort, pin, unpin, hide, and reset width actions with browser regression coverage
- right-click header menu open is now supported
- filtered-column indicator is now exposed on header cells

Why next:

- header UX is the most obvious product gap today
- without header-local actions, each consuming app will try to add its own control layer

Tasks:

- productize header visual states
- add pinned boundary cues and sticky shadow polish
- add per-column header action trigger
- add header menu actions:
  - sort ascending
  - sort descending
  - clear sort
  - pin left
  - pin right
  - unpin
  - hide column
  - reset width

Acceptance:

- users can perform core column actions from the header without side controls
- pinned and sorted columns remain visually clear
- filtered columns are visibly distinct in the header
- right-click and click both open the same header menu surface

Validation:

- Playwright click and escape-close paths
- pin/hide/sort regression checks

### P3. Slice 9C: Filter Row

Status:

- completed on `2026-03-13`
- in-grid filter row now renders under the sticky header and updates `GridQuery.filters`

Why before more range work:

- filter UX is part of the minimum “business grid” shell
- current external filter controls are useful for the lab but not the product surface

Tasks:

- add filter row under the header
- align filter cells with visible and pinned columns
- support text / select / number MVP filters
- serialize local drafts into `GridQuery.filters`
- keep server-mode query contract stable

Acceptance:

- filter inputs render in-grid and align with current columns
- apply and clear actions update the query model predictably

Validation:

- Playwright filter input, apply, clear, and pinned alignment verification

### P4. Slice 8 Polish: Stable Range Selection and Range-Aware Clipboard

Status:

- completed on `2026-03-13`
- drag range, keyboard range, range summary, range copy, invalid paste summary, and overflow policy behavior are implemented
- default row overflow policy is now `reject`, with explicit `append` opt-in in Grid Lab

Why here:

- the range foundation exists, but the user-facing experience is not stable enough yet
- this is one of the biggest IBSheet replacement signals

Tasks:

- stabilize drag selection in a real browser loop
- stabilize `Shift + Arrow` range extension
- add range summary in Grid Lab
- add range-aware copy serialization
- add paste validation summary and explicit error reporting
- decide and enforce overflow policy

Acceptance:

- drag-select `2 x 2` and `3 x 3` ranges reliably
- copy exports only the selected rectangle
- paste updates only the target rectangle
- invalid cells produce visible summary feedback
- row overflow behavior is explicit and regression-tested

Validation:

- Playwright drag, keyboard range, copy, paste, and invalid-input scenarios
- manual browser pass for sticky and pinned behavior remains recommended

### P5. Real-Grid Performance Verification

Status:

- in progress on `2026-03-13`
- `Bench` now includes a real `VibeGrid` performance lab with column pinning, filter row, range interaction, and row virtualization on the actual render path
- the current actual-path benchmark now runs at `10,000 / 50,000 / 100,000` rows
- combined-feature browser regression now covers range selection, filter interaction, header menu open, and pin-right behavior on `/labs/bench`
- interaction timing cards now expose scenario, selection, filter, sort, and column update timings

Why separate from Bench:

- Bench is useful, but the decision point is the real `VibeGrid` render path
- combined feature load matters more than isolated row virtualization

Tasks:

- keep the real-grid performance scenario in `apps/playground`
- verify 10k / 50k / 100k rows with:
  - pinning
  - sticky header
  - current header states
  - range interaction enabled
- measure paste and selection latency under realistic render load
- confirm sticky header and pinned boundary behavior remain stable under virtualization

Acceptance:

- no obvious freeze in typical business interactions
- pinned and sticky behavior remain stable under load
- the team can compare raw virtualization numbers against actual `VibeGrid` render-path numbers in one screen
- interaction timing signals are visible in the bench UI and reachable in browser regression

### P6. Product Infrastructure

This is the next layer after pilot-readiness.

Status:

- in progress on `2026-03-13`
- first-pass productization now covers:
  - scoped column-state persistence adapter
  - header menu labels through `@vibe-grid/i18n`
  - header and menu state colors through `@vibe-grid/theme-shadcn`
  - browser regression for persisted hidden columns after reload
- second-pass productization now also covers:
  - Grid Lab status message normalization through `@vibe-grid/i18n`
  - shared clipboard fallback validation copy through `@vibe-grid/i18n`
  - placeholder-based grid message formatting
  - wider theme token adoption across grid surface, body, row-state badges, editors, and sticky/range visuals

Work items:

- persistence adapter
- theme token extraction
- i18n message catalog
- error and status message normalization

Recommended order:

1. persistence
2. theme / tokens
3. i18n

Acceptance:

- consuming apps do not need ad hoc localStorage keys or hardcoded strings for core grid behavior

### P7. Test and Release Hardening

Status:

- in progress on `2026-03-13`
- first-pass hardening now covers:
  - stable vs experimental boundary documentation
  - hub-level smoke browser regression
  - Playwright CI retries, `forbidOnly`, and HTML report output
  - CI artifact upload for Playwright outputs
  - richer resize / persistence / compatibility browser regression
  - concrete release routine and changelog discipline
  - explicit Chromium-only CI policy with optional manual cross-browser smoke

Tasks:

- expand core unit coverage
- expand Playwright scenarios:
  - pinning
  - resize
  - filter row
  - header menu
  - range paste
  - validation feedback
- add cross-browser smoke later if needed
- define stable vs experimental API surface
- introduce release notes / versioning discipline

Acceptance:

- regressions are caught before push and in CI
- package consumers know what is stable and what is still experimental

## Explicit Deferrals

Do not prioritize these until the earlier items move:

- advanced saved views
- full IBSheet parity cloning
- tree/group rows
- code-help editor set
- server excel adapter
- undo/redo

## Recommended Next Three Work Items

If work continues immediately, execute in this order:

1. `TGP-2` React tree rendering MVP
2. `TGP-3` tree interaction rules
3. `TGP-4` Tree bench tab and browser coverage

Use `docs/roadmap/feature-expansion-backlog.md` as the entry point for this next stage.

## Tree Runtime Progress

### TGP-2

Status:

- completed on `2026-03-16`
- tree runtime now renders on the shared `VibeGrid` React surface behind the experimental `tree` prop
- Compatibility Lab includes a real runtime demo with browser-tested expand/collapse behavior

Next:

- `TGP-3` tree interaction rules
- `TGP-4` Tree bench mode and browser coverage

For the detailed hierarchical-view plan, use:

- `docs/roadmap/tree-group-pivot-runtime-plan.md`
- `docs/roadmap/bench-mode-split-design.md`
- `docs/roadmap/tree-group-pivot-backlog.md`

## Required Validation Policy

For any item touching UI or interaction:

- `npm run lint`
- `npm run build`
- `CI=1 npm run test:e2e`

Interpret Playwright validation as:

- real browser click verification
- real focus and keyboard verification
- paste and drag interaction verification
- sticky and pinned layout verification

## Status Discipline

When one of the priorities above meaningfully moves:

- update the corresponding slice status doc
- keep this execution plan aligned with the current highest-priority work
