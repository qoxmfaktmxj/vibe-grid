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

- `Slice 8` range selection is at foundation stage.
- Range contracts and range-aware paste anchor logic exist.
- Real browser drag and shift range behavior are not yet stable enough to call product-complete.

### Not Product-Complete Yet

- filtered-column indicator polish
- right-click header menu open
- range copy / paste error summary
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

- in progress on `2026-03-13`
- keyboard range extension, range summary, and invalid paste summary are implemented
- drag-range polish remains open before P4 can be called complete

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

Validation:

- Playwright keyboard range, copy, paste, and invalid-input scenarios
- manual browser pass for drag and sticky behavior until drag is stable enough for CI

### P5. Real-Grid Performance Verification

Why separate from Bench:

- Bench is useful, but the decision point is the real `VibeGrid` render path
- combined feature load matters more than isolated row virtualization

Tasks:

- add a real-grid performance scenario in `apps/playground`
- test 10k / 50k / 100k rows with:
  - pinning
  - sticky header
  - current header states
  - range interaction enabled
- measure paste and selection latency under realistic render load

Acceptance:

- no obvious freeze in typical business interactions
- pinned and sticky behavior remain stable under load

### P6. Product Infrastructure

This is the next layer after pilot-readiness.

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

1. `P3` filter row MVP
2. `P4` stable range selection / copy / paste polish
3. `P5` real-grid performance verification

That order keeps the next work focused on business-facing UX now that the runtime split is in place.

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
