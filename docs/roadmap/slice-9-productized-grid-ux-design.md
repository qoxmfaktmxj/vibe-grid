# Slice 9 Design: Productized Cell/Header UI, Header Menu, Filter Row

## Goal

Raise VibeGrid from a working lab grid to a more productized business grid by improving:

1. cell and header visual language
2. header interaction model
3. header menu
4. filter row
5. IBSheet-style operational discoverability

This slice is the bridge between a technically capable grid and a business-ready grid shell.

## Scope

This document covers two large improvements:

1. VibeGrid body and header visual productization
2. header menu + filter row as IBSheet replacement UX

## Non-Goals

- advanced saved views in this same slice
- tree/group rows
- full Excel parity
- server-driven filter builder dialogs

## Current Baseline

Relevant current files:

- grid runtime: [VibeGrid.tsx](C:/Users/kms/Desktop/dev/vibe-grid/packages/react/src/VibeGrid.tsx)
- playground shell: [PlaygroundWorkbench.tsx](C:/Users/kms/Desktop/dev/vibe-grid/apps/playground/src/app/PlaygroundWorkbench.tsx)
- compatibility guide: [compatibility/page.tsx](C:/Users/kms/Desktop/dev/vibe-grid/apps/playground/src/app/labs/compatibility/page.tsx)

VibeGrid already supports:

- sortable columns
- column visibility, order, sizing, pinning
- inline editors
- row state display
- basic status panels and side controls

What still feels unfinished:

- headers do not yet behave like a productized business grid header
- there is no per-column header action menu
- filters live outside the grid rather than in-grid
- body/header styling is functional but not yet opinionated enough

## Design Principles

### Principle 1: The grid should look operational, not experimental

The grid should read like a serious business tool:

- crisp header hierarchy
- strong pinned boundary cues
- restrained but clear state color
- compact information density without feeling cramped

### Principle 2: Header UX must be self-discoverable

Business users expect to find sorting, hiding, pinning, and filtering near the column header itself.

### Principle 3: Filter row should feel like part of the grid

Filter row is not a separate search form. It belongs directly under the header and should align perfectly with columns.

### Principle 4: Row-first UX remains the base

Even with richer header interactions, body behavior still prioritizes row-centric business operations.

## Part A: Productized Cell and Header Visual Design

## Header visual goals

Each header cell should communicate:

- name
- sort direction
- pin state
- filter active state
- menu availability

### Recommended header layout

```text
| Header Label        v |
| optional helper/meta |
```

Header should support:

- primary title
- small secondary status line when needed
- right-side icon cluster

### Header states

- default
- hover
- active sort
- filtered
- pinned left/right
- menu open

### Visual treatment

- subtle elevated surface for header
- stronger border at bottom than body rows
- sticky shadow for pinned edges
- sort icons always reserve space to prevent layout jump
- filter-active columns get a tinted underline or badge

## Body cell visual goals

Cells should communicate:

- editable vs readonly
- active cell
- invalid value
- dirty field
- row state context

### Required cell states

- default
- hover row
- active row
- active cell
- selected range cell
- readonly
- validation error
- dirty value
- deleted row

### Visual treatment

Recommended style mapping:

- dirty field: subtle tinted background, not full warning color
- validation error: light red ring or corner marker
- readonly: muted text and low-contrast background
- active row: soft slab highlight across row
- active cell: stronger inner ring
- deleted row: low-opacity row with delete chip preserved

## Token additions

Add visual tokens in the React/grid layer or shared theme module for:

- header background
- header hover background
- header active background
- cell hover background
- active row background
- active cell ring
- filter active tint
- dirty tint
- validation tint
- pinned edge shadow

## Recommended component decomposition

Within [VibeGrid.tsx](C:/Users/kms/Desktop/dev/vibe-grid/packages/react/src/VibeGrid.tsx), split rendering responsibilities into product-level parts.

Suggested internal components:

- `GridHeaderCell`
- `GridHeaderActions`
- `GridFilterCell`
- `GridBodyCell`
- `GridPinnedShadow`
- `GridColumnResizeHandle`

This keeps the main grid component from becoming a long style-and-events file.

## Part B: Header Menu Design

## Goal

Header menu should provide per-column actions close to IBSheet expectations without cloning IBSheet literally.

### Menu entry points

- click on a compact action icon in the header
- right click on the header

### Menu items for MVP

- sort ascending
- sort descending
- clear sort
- pin left
- pin right
- unpin
- hide column
- reset width
- auto-fit width later if implemented
- open filter focus

### Nice-to-have later

- multi-sort
- freeze until this column
- save current layout as preset
- conditional formatting hooks

## Header menu component model

Add a lightweight internal state:

```ts
type GridHeaderMenuState = {
  openColumnKey?: string;
  anchorRect?: DOMRect;
};
```

Menu state should be local to the React layer, not core domain state.

### Why

This is ephemeral UI state, not saved business state.

## Header menu interaction rules

- only one header menu can be open at a time
- opening a header menu should not trigger sort automatically
- clicking outside closes the menu
- `Escape` closes the menu
- keyboard focus returns to the triggering header button

## Part C: Filter Row Design

## Goal

Move filtering closer to the grid and make it column-aware.

### MVP rule

Filter row appears directly under the header row and aligns with visible columns.

### Filter row responsibilities

- hold draft filter inputs
- show per-column filter affordance
- commit filters with `Enter` or explicit apply
- clear individual column filters

### Which columns get filters

Use `VibeGridColumn.filterable`.

Recommended default filter types:

- text columns -> text input, operator `contains`
- select/code columns -> select input
- boolean/use flag -> select input
- numeric columns -> simple equality input in MVP

## Proposed column filter metadata

Extend [contracts.ts](C:/Users/kms/Desktop/dev/vibe-grid/packages/core/src/contracts.ts).

```ts
export type GridFilterEditorSpec<Row> =
  | { type?: "text"; placeholder?: string; op?: "contains" | "equals" }
  | { type: "select"; options: GridEditorOption[] | ((row?: Row) => GridEditorOption[]) }
  | { type: "number"; placeholder?: string; op?: "equals" | "gte" | "lte" };

export type VibeGridColumn<Row> = {
  ...
  filterable?: boolean;
  filterEditor?: GridFilterEditorSpec<Row>;
};
```

This keeps header/filter behavior defined at the column contract level.

## Filter row state model

Recommended local UI state in React layer:

```ts
type GridFilterDraftState = Record<string, unknown>;
```

Serialized output still maps to existing `GridQuery.filters`.

Core contract remains:

- `GridQuery`
- `GridFilter[]`

This is good because the host app already understands the serialized query model.

## Filter row interaction rules

- inputs align with visible columns only
- hidden columns do not render filter cells
- pinned columns pin their filter cells too
- `Enter` applies current draft filters
- clear icon removes that column's filter only
- global reset clears all filter row inputs

### Recommended apply policy

For server mode:

- draft locally
- apply on `Enter`, filter button, or debounce for specific columns later

For now:

- explicit apply is safer

## Visual Design for Filter Row

The filter row should not look like a separate form.

Recommended treatment:

- slightly softer surface than header
- compact controls
- active filtered columns show a stronger border/tint
- clear icon inside each filter cell when a value exists

## Integration with Server Query

Current playground already uses server query state externally.

The filter row should:

1. read visible columns and current query
2. build local drafts
3. serialize drafts into `GridFilter[]`
4. call existing host query handlers

This means filter row belongs in the React layer, not the core state machine.

## Development Slices

### Slice 9A: Header and body visual productization

- refine header cell structure
- add sticky/pinned shadows
- add body state visuals for dirty, invalid, readonly
- keep current behavior unchanged

Acceptance:

- grid reads like a product surface, not a demo surface

### Slice 9B: Header actions menu

- add header action trigger
- add menu overlay
- wire sort, hide, pin, reset width

Acceptance:

- users can perform core column actions entirely from the header

### Slice 9C: Filter row

- add filter row under headers
- wire draft state to `GridQuery.filters`
- support text/select/number MVP filters

Acceptance:

- users can filter directly inside the grid without side panels

### Slice 9D: IBSheet operational polish

- right-click open support
- filtered-column indicators
- active menu keyboard handling
- filter clear affordance

Acceptance:

- header UX feels operational and discoverable

## Test Plan

### Unit

- filter draft to `GridFilter[]` serialization
- header menu actions to column state transforms
- pin/unpin action behavior

### Component

- menu opens on header action click
- menu closes on outside click and escape
- filter row aligns with visible columns
- pinned columns keep header and filter row alignment

### E2E

- open header menu and pin a column
- hide/show column through menu
- apply text filter through filter row
- apply select filter through filter row
- ensure server query updates and data refreshes

## Acceptance Criteria

- header cells clearly show sort, menu, and filter state
- users can pin, hide, sort, and reset width from the header
- filter row works with visible columns and current query model
- pinned columns remain visually stable
- grid remains responsive under normal business usage

## Performance Notes

This slice should not materially hurt performance if:

- header menu state stays local
- filter row controls render only for visible columns
- expensive filter option generation is memoized
- pinned shadows are rendered as lightweight overlays

Primary risk:

- adding too many per-header and per-cell dynamic states in one large render tree

Mitigation:

- extract header and filter cells into focused components
- keep styling driven by derived props, not nested state

## Recommended Implementation Order

1. header/body token and component split
2. header action trigger and menu shell
3. column action wiring
4. filter row rendering
5. query serialization bridge
6. tests

## Recommended Defaults

- header action icon always visible on hover, always reserved in layout
- filter row enabled only when at least one visible column is filterable
- right-click support comes after click-menu support
- server apply remains explicit in MVP

## What This Unlocks Next

Once this slice is complete, the next logical features become much easier:

- saved views
- user column preferences
- advanced filter menu
- code-help editors
- IBSheet-style operational parity scenarios
