# Tree / Group / Pivot Backlog

## Purpose

This backlog turns the runtime-promotion decision into executable work items.

Use with:

- `docs/roadmap/tree-group-pivot-runtime-plan.md`
- `docs/roadmap/bench-mode-split-design.md`

## Phase 1. Tree Runtime MVP

### TGP-1. Core tree contract

Scope:

- add tree mode contract to `@vibe-grid/core`
- define parent-child relationship
- define expanded row state shape

Status:

- implemented on `2026-03-16`
- current scope includes:
  - `GridTreeSpec`
  - `GridTreeState`
  - expanded-row state helpers
- current boundary:
  - `experimental`
  - runtime rendering is not implemented yet

Acceptance:

- contract is serializable enough for host usage
- stable vs experimental boundary is documented

### TGP-2. React tree rendering

Scope:

- indentation
- expand / collapse toggle cell
- visible row flattening
- pinned and sticky compatibility

Acceptance:

- visible tree path renders correctly
- toggle interaction works in browser

### TGP-3. Tree interaction rules

Scope:

- row selection on visible nodes
- range selection rules for visible rows
- row-check / delete-check interaction rules

Acceptance:

- collapse / expand does not corrupt selection state
- hidden descendants are not accidentally targeted

### TGP-4. Tree bench tab

Scope:

- add `Tree` tab to Bench
- scenario data with multiple depths
- expand / collapse latency cards

Acceptance:

- Bench exposes tree-specific metrics
- Playwright smoke exists

## Phase 2. Group Runtime MVP

### TGP-5. Core group contract

Scope:

- group mode contract
- group key state
- expanded group state

Acceptance:

- group configuration is host-driven
- runtime can distinguish group rows from business rows

### TGP-6. React grouped rendering

Scope:

- group header rows
- group expand / collapse
- business rows nested under groups

Acceptance:

- group rows are non-editable
- business rows keep current edit semantics

### TGP-7. Group filter / sort rules

Scope:

- grouped visible row shaping
- filter interaction after grouping
- sort interaction after grouping

Acceptance:

- filter and sort remain deterministic
- grouped view does not corrupt save bundle semantics

### TGP-8. Group bench tab

Scope:

- add `Group` tab to Bench
- group expand / collapse metrics
- filter / sort interaction timing

Acceptance:

- Bench exposes grouped performance behavior
- Playwright smoke exists

## Phase 3. Pivot Experimental Continuation

### TGP-9. Pivot experimental review

Scope:

- decide if real pilot needs pivot
- confirm whether pivot belongs in `@vibe-grid/react` or a separate experimental layer

Acceptance:

- explicit decision captured in docs

### TGP-10. Pivot bench tab

Scope:

- if needed, add `Pivot (Experimental)` tab
- show generated columns and build time

Acceptance:

- pivot remains explicitly experimental
- no accidental promotion to stable runtime

## Shared Work

### TGP-11. Compatibility matrix update

Scope:

- move status from preview-only to runtime-implemented as phases complete

### TGP-12. Public API stability update

Scope:

- document which of tree/group contracts are stable vs experimental

### TGP-13. Playwright expansion

Scope:

- tree runtime smoke
- group runtime smoke
- bench mode smoke

## Recommended Execution Order

1. `TGP-2`
2. `TGP-3`
3. `TGP-4`
4. `TGP-5`
5. `TGP-6`
6. `TGP-7`
7. `TGP-8`
8. `TGP-9`
9. `TGP-10`

## Final Rule

Do not start `Group` runtime before `Tree` runtime has:

- shared contract
- browser validation
- Bench coverage

Do not start `Pivot` runtime promotion unless an explicit pilot requires it.
