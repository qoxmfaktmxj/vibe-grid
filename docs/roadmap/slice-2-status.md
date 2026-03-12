# Slice 2 Status

## Completed

- Added selection contracts to `@vibe-grid/core`:
  - `GridSelectionState`
  - `GridActiveCell`
  - selection helpers for activate/toggle/prune flows
- Updated the TanStack-backed React surface to understand:
  - active row
  - selected rows
  - active cell anchor
- Added a shared clipboard package with:
  - TSV parsing
  - clipboard schema generation from `VibeGridColumn`
  - rectangular paste plan building
  - append-row support when pasted ranges exceed loaded rows
- Upgraded the playground into a business-grid lab that now verifies:
  - row-first selection
  - multi-row selection with `Ctrl` / `Cmd`
  - side-form editing
  - rectangular clipboard paste from an active cell anchor
  - insert / copy / delete-toggle / save bundle preview

## What This Means

- The product no longer stops at static scaffolding.
- We now have a real interaction model shared across packages.
- Clipboard paste is not a page-local trick; it is part of the reusable package boundary.

## Next Slice

1. Move row validation into `@vibe-grid/core`.
2. Add cell edit session contracts:
   - enter edit
   - cancel edit
   - commit edit
3. Introduce an Excel module that reuses the same mutation pipeline as clipboard paste.
4. Start the first virtualization bench screen with 10,000+ rendered records.
5. Add Playwright-based interaction checks for:
   - row selection
   - row copy
   - delete toggle
   - paste apply

## Acceptance Gate For Slice 3

- Excel import preview can feed the same row mutation pipeline as clipboard paste.
- Validation errors can attach to row meta without breaking save bundle generation.
- Playground shows both dirty state and validation state on the same row model.
