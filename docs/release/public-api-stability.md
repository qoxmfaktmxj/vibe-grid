# Public API Stability

## Purpose

This document defines which parts of VibeGrid are safe to treat as shared product behavior and which parts remain experimental.

Until the repo reaches a non-private package release, this is an internal discipline document, not a public package guarantee. It still matters because multiple apps will depend on the same grid behavior.

## Stable For Pilot Use

These areas are expected to remain compatible unless a roadmap document explicitly calls out a contract change.

### `@vibe-grid/core`

- row state model
- save bundle model
- selection state shape
- filter and sorting query contracts
- column state shape used by the shared persistence adapter
- row-aware cell editability rules through column configuration

### `@vibe-grid/react`

- `VibeGrid` as the main app-facing React surface
- row-first selection behavior
- header menu actions:
  - sort
  - pin
  - hide
  - reset width
- filter row MVP
- range selection, range copy, and paste overflow policy behavior
- direct clipboard-paste entry through the shared `VibeGrid` surface
- row virtualization toggle through the published prop
- cell-level editable versus readonly rendering behavior driven by the shared contract
- dedicated delete-check control column behavior driven through the shared React surface
- edit activation option through the shared React surface with `doubleClick` default
- density option through the shared React surface with `compact | default | comfortable`
- shared density metrics helper through `@vibe-grid/react`:
  - `resolveGridDensityMetrics`
- date editor foundation through the shared React surface with host-provided date policy callbacks
- shared host-calendar helpers through `@vibe-grid/core`:
  - `createGridDatePolicy`
  - `createGridDateEditorSpec`
  - `createGridDateValidators`
- HeaderCheck-style rowCheck behavior through the shared React surface

### Product Validation Rules

- `npm run lint`
- `npm run build`
- `CI=1 npm run test:e2e`

These are part of the stable contract because regressions in shared behavior are not acceptable once a pilot consumes the grid.

## Experimental

These areas are still subject to product-level iteration and should not be treated as long-term guarantees yet.

### Performance and Benchmark Surfaces

- timing cards in Bench
- exact latency values and thresholds
- benchmark page layout and data attributes used only for diagnostics

### Theme and Presentation Details

- exact token names inside `@vibe-grid/theme-shadcn`
- lab shell cards and non-grid presentation surfaces
- purely cosmetic class names and internal visual composition details

### Product Infrastructure Beyond Current Scope

- persistence beyond column state
- locale catalog completeness beyond the default currently shipped copy
- any future saved-view or server preference behavior
- public event payload naming and stable/experimental boundary
- Group / Tree / Pivot promotion from preview helpers into runtime behavior

### Experimental Product Extensions

- tree runtime contracts in `@vibe-grid/core`
  - `GridTreeSpec`
  - `GridTreeState`
  - `createGridTreeState`
  - `sanitizeGridTreeState`
  - `isGridTreeRowExpanded`
  - `setGridTreeRowsExpanded`
  - `shapeGridTreeRows`
  - `toggleGridTreeRowExpanded`
- experimental tree runtime rendering in `@vibe-grid/react`
  - `tree.spec`
  - `tree.state`
  - `tree.onStateChange`
  - indentation and expand/collapse toggle rendering on the first visible business column
- `GridPublicEventHandlers`
  - `onBeforePaste`
  - `onAfterPaste`
  - `onAfterSave`
  - `onAfterRowCopy`
- experimental compatibility helpers in `@vibe-grid/core`
  - `buildGridGroupPreview`
  - `flattenGridTree`
  - `buildGridPivotPreview`

## Release Discipline

### Before Treating A Behavior As Stable

- the behavior must be exercised in Grid Lab, Bench, or Compatibility
- it must have Playwright browser coverage when it affects UI or interaction
- the current roadmap document must not still describe it as unresolved

### When A Stable Behavior Changes

- update the relevant roadmap status doc
- update this document if the stable or experimental boundary moved
- add or adjust Playwright coverage before push

## Current Recommendation

Treat VibeGrid as:

- stable enough for internal pilot screens
- not yet fully standard-ready for uncontrolled broad adoption across multiple apps

That means pilot consumers can build on the stable list above, but broader rollout should wait until the remaining P6/P7 work is closed.
