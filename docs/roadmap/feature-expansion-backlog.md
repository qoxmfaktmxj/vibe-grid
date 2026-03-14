# Feature Expansion Backlog

## Scope

This document starts the next phase after the current product-hardening work.

The goal is to expand business behavior without breaking the product boundaries already established in:

- `@vibe-grid/core`
- `@vibe-grid/react`
- the current Playwright browser regression suite

## Guiding Rule

Do not add new features as isolated page hacks.

Every feature below should be implemented as shared product behavior with:

- contract changes in `@vibe-grid/core` when needed
- React wiring in `@vibe-grid/react`
- Grid Lab verification in `apps/playground`
- Playwright browser verification in `tests/e2e`

## Recommendation About Date Editor

### Short answer

Yes. A date editor should use a modern UI surface such as `shadcn/ui`-style popover + calendar behavior.

### But the boundary matters

Do **not** put `shadcn/ui` into `@vibe-grid/core`.

Recommended split:

- `@vibe-grid/core`
  - only the date editor contract
  - parse / validate behavior
  - serializable date value rules
- `@vibe-grid/react`
  - actual date editor component
  - popover
  - calendar rendering
  - keyboard and commit/cancel behavior

### Holiday / business-calendar requirement

The editor itself should not fetch holiday data directly.

Recommended model:

- the host app loads a business calendar or holiday dataset
- the grid receives that data through column config, callback, or shared context
- the date editor uses that already-loaded data to disable or annotate dates

That keeps the grid reusable and avoids hiding network dependencies inside an editor.

### Recommended first contract

Add a new editor type roughly in this shape:

- `type: "date"`
- `placeholder?`
- `minDate?`
- `maxDate?`
- `disabledDate?: (date, row) => boolean`
- `dateBadge?: (date, row) => "holiday" | "weekend" | "special" | undefined`

The exact API can change, but the key design point is:

- data and policy come from the host
- rendering lives in `@vibe-grid/react`

## Requested Features

## FE-1. Delete Check Column

### Goal

Add a dedicated checkbox column for delete marking.

This is **not** generic row selection.
It is only for toggling delete state.

### Why this matters

Current row selection and delete toggle are separate command flows.
For business grids, a dedicated delete-mark column is familiar and makes save intent clearer.

### Expected behavior

- internal checkbox column appears near the left control columns
- checking a row marks it as delete target
- unchecking restores the row
- newly inserted rows may be removed or de-marked according to current delete semantics
- this checkbox does not replace the row-selection model

### Product rule

Keep this separate from:

- `selectedRowIds`
- active row
- range selection

### Implementation notes

- preferred internal column key: `__deleteCheck`
- the checkbox should map to existing `toggleRowDeleted` behavior
- header-level “check all delete” is optional and should come later

### Validation

- checkbox click marks row deleted
- checkbox unclick restores row
- save bundle reflects deleted rows correctly
- range and row selection do not become confused with delete marking

### Status

- implemented on `2026-03-13`
- shared `VibeGrid` now exposes a dedicated `__deleteCheck` internal column
- Grid Lab uses the shared checkbox event to drive the existing `toggleRowDeleted` semantics
- current browser coverage verifies:
  - delete check marks a loaded row as deleted
  - delete check can restore a loaded row before save
  - save bundle includes deleted row keys

## FE-2. Single-Click Edit For Editable Cells

### Goal

If a cell is editable, clicking it should enter edit mode immediately.

### Current state

- current behavior is closer to double-click or explicit edit flow
- row-first UX is still the default model

### Recommendation

Do not globally force this for every grid immediately.

Add a product option such as:

- `editActivation: "doubleClick" | "singleClick"`

Recommended default:

- `doubleClick`

Recommended business opt-in:

- `singleClick`

### Why not force it globally

Immediate edit on every click can conflict with:

- row selection
- range selection
- shift selection
- drag range start

### Safe rule

Single-click edit should only start when:

- the column is editable
- the specific cell is editable
- the click is not range-extension intent
- the click is not Ctrl/Cmd multi-select intent
- the click is not on internal columns such as row number, row state, delete checkbox

### Validation

- editable business cell enters edit immediately
- non-editable cell does not
- row selection still works
- range selection still works
- paste anchor behavior does not regress

### Status

- implemented on `2026-03-13`
- shared `VibeGrid` now exposes `editActivation?: "doubleClick" | "singleClick"`
- default remains `doubleClick`
- Grid Lab exposes an opt-in mode switch for browser verification
- current browser coverage verifies:
  - default click does not immediately open an inline editor
  - `singleClick` opens inline edit on editable cells
  - readonly cells still do not enter edit mode

## FE-3. Paste Should Update Only Editable Cells

### Goal

When pasting from Excel or another grid, only editable cells should change.

### Current state

This is already partially true at the column level.

Current behavior already skips:

- hidden columns
- readonly columns

### Missing part

What is still missing is **cell-level** or **row-conditional** editability.

Example:

- one column is generally editable
- but some rows or states should make that cell readonly

### Recommended contract change

Extend column editability from:

- `editable?: boolean`

to something like:

- `editable?: boolean | ((row) => boolean)`

or

- `canEdit?: (row) => boolean`

The design should allow:

- click-to-edit checks
- inline editor enable/disable
- side editor enable/disable
- paste apply / skip logic

to all use the same rule.

### Required behavior

- paste only changes cells that are actually editable
- non-editable targets are skipped, not overwritten
- skipped editable conflicts appear in the paste summary
- validation still applies to editable target cells

### Validation

- readonly target cells stay unchanged
- editable target cells update
- summary shows skipped readonly cells
- invalid values still report validation errors

### Status

- implemented on `2026-03-13`
- shared clipboard module now exposes a paste-plan summary helper
- Grid Lab now shows:
  - matrix size
  - skipped total
  - per-reason skipped counts
  - first skipped cell summary
  - first validation error summary
- current browser coverage verifies:
  - append mode summary
  - reject overflow summary
  - readonly skip summary
  - validation summary

## Recommended Implementation Order

1. `FE-3a` shared cell-level editability contract
2. `FE-1` dedicated delete check column
3. `FE-2` single-click edit activation option
4. `FE-3b` paste summary and skip reporting using the new cell-level editability rule
5. `FE-4` date editor foundation

This order is deliberate.

Reason:

- delete checkbox and single-click edit both depend on clean cell-behavior rules
- paste policy should not be reworked twice
- date editor is easier once edit activation and cell-level editability rules are stable

## Recommended First Slice To Start

Status:

- `FE-3a cell-level editability contract` is implemented on `2026-03-13`
- `FE-1 dedicated delete check column` is implemented on `2026-03-13`
- `FE-2 single-click edit activation option` is implemented on `2026-03-13`
- `FE-3b paste summary and skip reporting polish` is implemented on `2026-03-13`
- current demo rule:
  - `note` is editable only when `useYn === "Y"`
- current coverage:
  - cell-level editability attribute in the grid body
  - side editor disabled state
  - paste skips readonly targets and reports `readonly` in the summary
  - dedicated delete checkbox marks and restores loaded rows
  - edit activation can switch between `doubleClick` and `singleClick`
  - paste summary exposes matrix, skipped-total, per-reason, and first-error details

## FE-4. Date Editor Foundation

### Goal

Add a shared date editor surface that supports:

- ISO date values
- manual date input
- calendar popover selection
- host-provided date disable rules
- host-provided badge rules for special dates

### Product boundary

- `@vibe-grid/core`
  - date editor contract
  - serializable date values
- `@vibe-grid/react`
  - actual inline date editor UI
  - calendar popover rendering
- host app
  - holiday/business-calendar data
  - date policy callbacks

### Status

- implemented on `2026-03-14`
- current Grid Lab demo adds `effectiveDate`
- host-calendar wiring was raised into `@vibe-grid/core` on `2026-03-14` through `createGridDatePolicy`
- current inline editor supports:
  - native date input
  - calendar popover
  - min/max date range
  - disabled dates
  - holiday/weekend/special badge styling
- current browser coverage verifies:
  - calendar popover opens
  - blocked weekend dates are disabled
  - blocked holiday dates are disabled
  - allowed dates commit back into the cell and side editor

Next recommended slice:

- date editor host-integration examples

## Acceptance Before Calling Feature Expansion Successful

- new behavior lives in shared packages, not only in the lab page
- Grid Lab demonstrates the feature
- Playwright covers the new interaction
- `AGENTS.md`, roadmap docs, and changelog are updated
