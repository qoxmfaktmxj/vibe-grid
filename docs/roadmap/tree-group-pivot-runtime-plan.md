# Tree / Group / Pivot Runtime Promotion Plan

## Purpose

This document decides how `Tree`, `Group`, and `Pivot` should move from compatibility preview into product runtime behavior.

The goal is not to force all three into `VibeGrid` immediately.

The goal is to promote only the parts that fit the current business-grid contract without destabilizing:

- row-first UX
- selection / paste / save bundle semantics
- current performance guarantees
- current stable vs experimental API boundaries

## Current State

### What exists now

- `HeaderCheck` is implemented on the shared runtime path.
- public host events exist as an experimental shared contract.
- `Group / Tree / Pivot` preview builders exist in `@vibe-grid/core`.
- Compatibility Lab renders preview sections for all three.

### What does not exist yet

- no runtime `mode="tree"` in `VibeGrid`
- no runtime grouped row rendering in `VibeGrid`
- no runtime pivot surface in `VibeGrid`
- no real-grid bench path for tree/group/pivot-specific behavior

## Product Decision

### Runtime promotion order

Promote in this order:

1. `Tree`
2. `Group`
3. `Pivot`

### Why this order

#### Tree first

Tree is the closest fit to the current business-grid product.

It matches:

- organization hierarchy
- nested codes
- expandable business rows
- row-first interaction

It can reuse much of the current selection, active-row, header, filter, and sticky behavior.

#### Group second

Group is useful, but it changes the visible row model and event boundaries more aggressively.

It should be promoted only after Tree proves that runtime hierarchical row shaping can coexist with:

- range selection
- delete check
- header check
- filter row
- pinning
- save bundle isolation

#### Pivot last

Pivot should **not** be promoted into the main runtime yet.

Pivot is not just another row-shaping mode. It changes:

- column generation
- aggregation rules
- wide-table behavior
- selection meaning
- editing expectations

For now, Pivot should remain:

- experimental
- compatibility-lab visible
- bench-testable
- outside the default `VibeGrid` runtime contract

## Recommended Product Surface

### Stable runtime targets

Recommended stable runtime modes:

- `flat`
- `tree`
- `group`

### Experimental runtime target

Keep as experimental:

- `pivot`

### Recommended shape

Do not expose TanStack-specific row model concepts.

Recommended product-level surface:

```ts
type GridViewMode = "flat" | "tree" | "group";
```

Possible later experimental extension:

```ts
type ExperimentalGridViewMode = "pivot";
```

## Tree Runtime Proposal

### Scope

Tree runtime should support:

- row indentation
- expand / collapse toggle
- default expanded state
- host-provided parent-child relationship
- row-first selection on visible nodes
- pinned columns and sticky header
- filter row on the visible tree path

### Non-goals for the first slice

- drag-and-drop tree reorder
- tree-specific save semantics
- lazy async child loading
- tree subtotal rows

### Required contracts

Candidate shared contract:

```ts
type GridTreeSpec<Row> = {
  mode: "tree";
  getRowKey: (row: Row) => string;
  getParentRowKey: (row: Row) => string | null;
  defaultExpandedRowKeys?: string[];
  initiallyExpandAll?: boolean;
  canExpand?: (row: Row) => boolean;
};
```

### Acceptance

- expand / collapse works in real browser interaction
- selection survives collapse / expand predictably
- range selection only applies to visible rows
- save bundle ignores view-only tree expansion state

## Group Runtime Proposal

### Scope

Group runtime should start as read-focused grouped display.

It should support:

- grouping by one or more columns
- expandable group header rows
- row count summary
- optional simple aggregates later
- filter / sort interaction after grouping

### First-slice rule

First runtime group support should be:

- read-only on group rows
- edit only on business rows
- delete / row-check only on business rows

### Required contracts

Candidate shared contract:

```ts
type GridGroupSpec<Row> = {
  mode: "group";
  groupBy: string[];
  defaultExpandedGroupKeys?: string[];
};
```

### Acceptance

- group rows do not behave like editable business rows
- filtering and sorting remain deterministic
- visible row reshaping cost remains acceptable in bench mode

## Pivot Strategy

### Recommendation

Do not merge Pivot into the main runtime yet.

### Keep Pivot in

- Compatibility Lab
- dedicated experimental bench tab
- explicit experimental docs

### Revisit only when

- Tree runtime is stable
- Group runtime is stable
- wide-column virtualization strategy is clearer
- a real pilot requires pivot behavior

## Bench Strategy

Tree / Group / Pivot should not be validated only in Compatibility Lab.

They need their own performance and interaction surface.

Recommended approach:

- keep one Bench app
- split Bench into runtime-specific tabs:
  - `Flat`
  - `Tree`
  - `Group`
  - `Pivot (Experimental)`

More detail is in:

- `docs/roadmap/bench-mode-split-design.md`

## Promotion Gates

### Tree runtime gate

- runtime contract defined
- Grid Lab or dedicated lab demonstrates tree behavior
- bench tab exists
- Playwright browser regression exists
- compatibility matrix updated

### Group runtime gate

- grouped rows clearly separated from business rows
- bench tab exists
- filtering / sorting / collapse behavior browser-tested
- no save-bundle confusion from grouped display

### Pivot review gate

- no automatic promotion
- separate ADR or explicit execution-plan update required

## Recommended Order Of Work

1. add Bench mode split design
2. implement `Tree` runtime MVP
3. add `Tree` bench tab and browser regression
4. implement `Group` runtime MVP
5. add `Group` bench tab and browser regression
6. keep `Pivot` experimental until pilot pressure justifies runtime work

## Final Recommendation

- promote `Tree` to runtime
- promote `Group` after Tree stabilizes
- keep `Pivot` experimental for now

This gives the best balance between product usefulness and runtime complexity.
