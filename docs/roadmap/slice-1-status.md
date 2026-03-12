# Slice 1 Status

## Completed

- Scaffolded the standalone `vibe-grid` monorepo with product apps and shared packages.
- Added `@vibe-grid/core` public contracts for:
  - row-first grid commands
  - serializable query state
  - row state metadata
  - save bundle payloads
- Implemented initial row state helpers:
  - `createLoadedRow`
  - `createInsertedRow`
  - `applyRowPatch`
  - `toggleRowDeleted`
  - `buildSaveBundle`
  - `markRowsSaved`
- Added a default command registry that preserves legacy command vocabulary:
  - `IBSEARCH`
  - `IBINSERT`
  - `IBCOPYROW`
  - `IBDELETE`
  - `IBSAVE`
  - `IBDOWNEXCEL`
  - `IBDOWNEXCEL_SAMPLE`
  - `IBLOADEXCEL`
- Stabilized workspace lint/build scripts so app linting no longer scans generated `.next` output.

## Current Product Boundary

- Apps consume `@vibe-grid/core` and `@vibe-grid/react`.
- Apps do not talk to TanStack APIs directly.
- Benchmark fixtures live in `@vibe-grid/core` for now and should move to a dedicated testing fixture package when the bench harness expands.

## Next Slice

1. Add `ActiveRow` and `SelectedRows` state contracts to `@vibe-grid/core`.
2. Build the first TanStack adapter bridge for:
   - column mapping
   - row selection
   - sorting
   - visibility
   - pinning
3. Create a real `playground` screen that renders a simple business grid with:
   - row selection
   - insert
   - copy row
   - delete toggle
   - dirty state badges
4. Add a clipboard package contract for rectangular paste input.
5. Start IBSheet compatibility tagging in `docs/compatibility`.

## Acceptance Gate For Slice 2

- `playground` can render 1,000 mock rows with row-first selection.
- `buildSaveBundle` output is visible in the UI for manual verification.
- Toolbar actions use the command registry rather than hard-coded button wiring.
- No app imports `@tanstack/react-table` except the adapter layer.
