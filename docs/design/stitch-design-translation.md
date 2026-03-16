# Stitch Design Translation

## Source

- `C:/Users/kms/Downloads/stit/stitch_design1/nexus_enterprise/DESIGN.md`
- `C:/Users/kms/Downloads/stit/stitch_design1/employee_master_info_grid/code.html`
- `C:/Users/kms/Downloads/stit/stitch_design1/candidate_management_grid/code.html`
- `C:/Users/kms/Downloads/stit/stitch_design1/performance_dashboard_grid/code.html`

## Chosen Reference

The primary reference for `VibeGrid` is `employee_master_info_grid`.

Reasons:

- it is the closest match to a dense business grid
- it already shows filter chips, table header density, status pills, and action layout
- it is easier to translate into a shared grid product than the dashboard-heavy or candidate-heavy alternatives

Secondary references:

- `candidate_management_grid` for contextual chips and softer people-centric row composition
- `performance_dashboard_grid` for lab-shell cards and dashboard chrome, not for the shared grid body

## Translation Rules

### Keep in `@vibe-grid/react`

- grid surface layering
- header chrome
- filter row chrome
- body zebra striping
- row state badges
- header menu glass styling
- editor surface styling

### Keep out of `@vibe-grid/react`

- left sidebar
- global top nav
- KPI cards
- dashboard heatmaps
- app-level page shells

Those belong in consuming apps or lab shells, not in the shared grid package.

## Token Mapping

### Surface

- base shell background: `#f7f9fb`
- grid card background: `#ffffff`
- ghost boundary: `rgba(196, 198, 210, 0.18)`
- ambient shadow: `0 24px 48px rgba(25, 28, 30, 0.06)`

### Header

- idle header background: `#e6e8ea`
- sorted background: `#eef2ff`
- filtered background: `#edf3ff`
- pinned background: `#eef4f7`
- open-menu background: `#dae2ff`
- text tone: `#444650`

### Filter Row

- row background: `#f8fafb`
- control background: `#ffffff`
- control border: `rgba(196, 198, 210, 0.3)`
- primary apply chip: `#dae2ff`
- primary apply text: `#001947`

### Body

- odd row: `#ffffff`
- even row: `#f2f4f6`
- selected row: `rgba(218, 226, 255, 0.42)`
- active row: `rgba(177, 197, 255, 0.42)`
- range fill: `rgba(218, 226, 255, 0.58)`
- active cell outline: `#001641`

## Product Decisions

### No-Line Rule

The design source discourages hard borders for layout sectioning.

Applied interpretation for VibeGrid:

- use tonal separation first
- keep only low-opacity ghost borders where table alignment still needs them
- avoid heavy dark divider lines

### Typography

Applied interpretation:

- smaller, denser header labels
- stronger letter spacing in header metadata
- body text remains readable and slightly heavier than before

### Interaction

Do not let styling break the existing business interaction model.

The following must remain intact:

- row-first behavior
- range selection
- filter row usability
- header menu usability
- resize affordance visibility
- inline editor clarity

## Current Implementation Scope

This translation pass covers:

- `packages/theme-shadcn`
- `packages/react/src/VibeGrid.tsx`
- `packages/react/src/internal/VibeGridTableHeader.tsx`
- `packages/react/src/internal/VibeGridFilterRow.tsx`
- `packages/react/src/internal/VibeGridTableBody.tsx`
- `packages/react/src/internal/VibeGridHeaderMenu.tsx`

It does not yet restyle:

- playground page shell
- bench shell
- compatibility shell
- advanced editor families beyond current inline editors

## Next Design Pass

1. apply the same design language to the playground shell
2. refine row hover and sticky boundary polish
3. align date editor popover with the same glass and tonal system
4. add iconography to header-menu actions if the product keeps the menu stable
