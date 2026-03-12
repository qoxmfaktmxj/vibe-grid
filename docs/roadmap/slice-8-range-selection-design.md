# Slice 8 Design: Excel-Like Range Selection, Copy, Paste

## Goal

Add spreadsheet-style rectangular cell selection to VibeGrid without breaking the product's row-first business UX.

The result should support:

1. dragging to select only a rectangular cell area
2. copying only the selected range
3. pasting a rectangular block from Excel or the web into the selected anchor area
4. validating pasted values by column type and rules
5. keeping scroll and interaction responsive on large datasets

## Non-Goals

- full spreadsheet parity such as fill-handle, merged cells, formulas, or multi-sheet behavior
- replacing the current row-first UX as the default interaction
- column virtualization in this slice

## Current Baseline

Relevant current implementation:

- selection state: [contracts.ts](C:/Users/kms/Desktop/dev/vibe-grid/packages/core/src/contracts.ts)
- row-first selection helpers: [selection.ts](C:/Users/kms/Desktop/dev/vibe-grid/packages/core/src/selection.ts)
- paste plan builder: [index.ts](C:/Users/kms/Desktop/dev/vibe-grid/packages/clipboard/src/index.ts)
- validation pipeline: [validation.ts](C:/Users/kms/Desktop/dev/vibe-grid/packages/core/src/validation.ts)

Today VibeGrid already has:

- `activeRowId`
- `selectedRowIds`
- `activeCell`
- rectangular paste planning from a single anchor cell
- column-level parse and validate hooks

What is missing:

- dragged cell range selection
- range-aware copy
- range overlay rendering
- range-aware paste conflict and validation reporting

## Product Decision

VibeGrid keeps **row-first UX as the default** and adds **cell-range UX as an explicit secondary mode**.

This means:

- single click on a row still means row activation
- row controls like `No`, `상태`, checkbox, delete toggle remain row-oriented
- dragging across business cells creates a rectangular range
- copy prefers range selection if present, otherwise falls back to row behavior
- paste targets the top-left anchor of the current cell range if present, otherwise `activeCell`

## UX Rules

## Interaction model

### Default behavior

- single click on any business cell:
  - set `activeRowId`
  - set `activeCell`
  - clear previous range selection
- click on row utility area:
  - row selection only
- command buttons continue to work from row selection by default

### Range selection behavior

- mouse down on an editable business cell starts a range candidate
- mouse move across cells updates the focus cell
- mouse up finalizes a rectangular range
- range selection uses `anchorCell + focusCell`
- the selected rectangle is derived, not separately stored as indexes

### Keyboard behavior

- `Shift + Arrow` extends the current range
- `Esc` clears range and returns to row-first state
- `Ctrl/Cmd + C` copies selected range if range exists
- `Ctrl/Cmd + V` pastes into range anchor or active cell
- `Enter`, `F2`, double click still enter edit mode for the active cell

### Copy behavior

- if range exists:
  - copy only that rectangular block as TSV
- if no range exists:
  - current behavior remains

### Paste behavior

- top-left cell of the selected range is the paste anchor
- `3 x 3` pasted values update exactly `3 x 3`
- hidden columns are skipped
- read-only columns are skipped
- out-of-bounds rows follow policy

Recommended default row overflow policy:

- visible loaded rows first
- if pasted range exceeds bottom:
  - append rows only when `allowAppendRows` is enabled
  - otherwise reject overflow cells and report them

## Proposed Core Contract Changes

Add these types in [contracts.ts](C:/Users/kms/Desktop/dev/vibe-grid/packages/core/src/contracts.ts).

```ts
export type GridCellRangeSelection = {
  anchor: GridActiveCell;
  focus: GridActiveCell;
};

export type GridSelectionMode = "row" | "range";

export type GridSelectionState = {
  activeRowId?: string;
  selectedRowIds: Set<string>;
  activeCell?: GridActiveCell;
  range?: GridCellRangeSelection;
  mode?: GridSelectionMode;
};
```

Important rule:

- `range` stores only `anchor` and `focus`
- actual rectangle is derived from current row order and column order

This avoids stale index bugs when:

- sorting changes
- filtering changes
- pagination changes
- column visibility or ordering changes

## Proposed Core Helpers

Add helpers in [selection.ts](C:/Users/kms/Desktop/dev/vibe-grid/packages/core/src/selection.ts).

### New helpers

- `beginRangeSelection(selection, anchorCell)`
- `updateRangeSelection(selection, focusCell)`
- `commitRangeSelection(selection)`
- `clearRangeSelection(selection)`
- `hasRangeSelection(selection)`
- `getNormalizedRange(selection, rowOrder, visibleColumnKeys)`
- `extendRangeByArrow(selection, direction, rowOrder, visibleColumnKeys)`

### Expected behavior

- beginning a range also updates `activeRowId` and `activeCell`
- range selection does not automatically multi-select rows
- clearing range should preserve `activeRowId` and `activeCell`

## Clipboard Engine Design

Create a range-aware clipboard module on top of [index.ts](C:/Users/kms/Desktop/dev/vibe-grid/packages/clipboard/src/index.ts).

### New responsibilities

- serialize selected range to TSV
- build paste plan from selected range anchor
- validate incoming pasted values before commit
- report partial failures per cell

### New types

```ts
export type GridClipboardCellError = {
  rowKey: string;
  columnKey: string;
  input: string;
  message: string;
};

export type GridPasteResult<Row> = {
  appliedCellCount: number;
  skippedCells: ClipboardSkippedCell[];
  validationErrors: GridClipboardCellError[];
  patches: Array<{ rowKey: string; patch: Partial<Row> }>;
  appendedRows: Partial<Row>[];
};
```

### New helpers

- `serializeRangeToTsv(...)`
- `buildValidatedPastePlan(...)`
- `applyPastePlanToRows(...)`

## Validation Design

Paste validation must use the same rules as direct editing.

Input pipeline:

1. parse text into matrix
2. map matrix into target cells
3. parse each incoming string using column parser
4. validate each parsed value using column validators
5. build patches only for valid cells
6. apply patches in one batch
7. re-run row validation after mutation

### Validation policy

Recommended default:

- fail per invalid cell, not whole paste
- show summary:
  - `9 cells pasted`
  - `2 skipped`
  - `1 validation error`

Examples:

- number column receives `"abc"`
  - skip that cell
  - add validation error
- required code column receives empty string
  - allow draft if business rules permit empty draft
  - otherwise reject and surface the error

## Rendering Strategy

Do not render the selected range by mutating every cell into a special React state tree.

Recommended rendering approach:

1. keep the active cell highlight
2. derive a normalized range rectangle
3. render a lightweight overlay layer above the grid body
4. optionally tint cells inside the range using a cheap class only for visible cells

### Why

This keeps drag performance acceptable on large visible windows and avoids React churn during mouse movement.

## Performance Strategy

Range selection should not materially slow the grid if implemented with these rules:

- use `anchor/focus` refs during drag
- promote selection updates with `requestAnimationFrame`
- commit React state at frame boundaries, not every mouse event
- calculate visible range only against visible rows and visible columns
- batch paste application into one row update pass
- avoid per-cell local component state

### Expected impact

- normal click/edit usage: negligible
- drag selection over visible viewport: small and acceptable
- large paste operations: depends on validation count, but should remain responsive with batch apply

### High-risk combinations

- pinned columns + sticky header + overlay + heavy cell renderers
- thousands of invalid cells with immediate error rendering

Mitigation:

- summary-first error reporting
- error badges only on visible cells
- defer expensive diagnostics until after paste commit

## VibeGrid React Layer Changes

Primary file:

- [VibeGrid.tsx](C:/Users/kms/Desktop/dev/vibe-grid/packages/react/src/VibeGrid.tsx)

Needed changes:

1. add pointer handling for business cells
2. distinguish row utility columns from business columns
3. add drag lifecycle:
   - `pointerdown`
   - `pointerenter`
   - `pointerup`
4. derive and render range overlay
5. intercept `Ctrl/Cmd + C`
6. route `Ctrl/Cmd + V` to validated paste pipeline

Recommended implementation detail:

- utility columns `__rowNumber`, `__rowState`, future checkbox column remain excluded from range selection
- range selection applies only to visible business columns

## Development Slices

### Slice 8A

- add core range types
- add selection helpers
- add normalized range derivation
- no UI drag yet

Acceptance:

- unit tests for range normalization and keyboard extension

### Slice 8B

- add drag-based rectangular selection in `VibeGrid`
- render visible range highlight
- keep row-first click behavior intact

Acceptance:

- user can drag-select a `3 x 3` region
- row action buttons still work from row selection

### Slice 8C

- add range-aware copy
- add TSV serialization

Acceptance:

- copying selected `2 x 2` region pastes correctly into a text editor or spreadsheet

### Slice 8D

- add validated paste pipeline
- support partial failures
- add status summary and visible error feedback

Acceptance:

- `3 x 3` paste changes only the target `3 x 3`
- invalid numeric cells are skipped
- status panel reports applied/skipped/error counts

## Test Plan

### Unit

- range normalization
- row/column order changes
- TSV serialization
- parser and validator integration
- partial paste failure handling

### Component

- drag creates a rectangular range
- row click still activates row
- `Shift + Arrow` extends range
- copy chooses range over row

### E2E

- select `2 x 2` range and copy
- paste `3 x 3` from textarea fixture into grid
- numeric column rejects text
- hidden/read-only columns are skipped

## Acceptance Criteria

- row-first business UX remains intact
- rectangular range selection works with drag and keyboard extension
- copy exports only selected range
- paste updates only the targeted rectangle
- invalid cells are rejected with clear feedback
- no perceptible freeze on typical pasted blocks such as `10 x 20`

## Recommended Implementation Order

1. contracts + selection helpers
2. normalized range derivation
3. VibeGrid pointer lifecycle
4. range overlay
5. range copy
6. validated paste
7. tests

## Open Decisions

These should be fixed before implementation starts:

1. Should drag-to-range always start on business cells, or require a modifier key?
2. On row overflow, should we append rows by default or reject overflow cells?
3. Should invalid paste cells keep old values silently, or show explicit cell-level markers?

Recommended defaults:

1. drag on business cells starts range selection without modifier
2. overflow cells reject by default
3. show summary plus visible cell marker for invalid cells
