# Bench Mode Split Design

## Purpose

`Bench` currently validates the actual `VibeGrid` render path under combined feature load.

That is necessary, but it is no longer sufficient once hierarchical or analytical views are considered.

This document defines how Bench should evolve so performance and interaction regressions can be tested by view type.

## Problem

`Flat`, `Tree`, `Group`, and `Pivot` do not stress the grid in the same way.

### Flat stress

- row virtualization
- filter row
- paste
- edit activation
- save bundle

### Tree stress

- expand / collapse
- indentation
- visible row reshaping
- selection after collapse
- sticky + pinned + nested rows

### Group stress

- group header rows
- expanded group state
- grouped row reshaping
- filter / sort after grouping
- non-business rows mixed with business rows

### Pivot stress

- dynamic column explosion
- aggregation
- wide horizontal scroll
- analytical rather than CRUD expectations

Because these differ, Bench should expose them separately.

## Recommended Structure

Keep one Bench route:

- `/labs/bench`

Inside that route, split the workbench into tabs or mode switches:

1. `Flat`
2. `Tree`
3. `Group`
4. `Pivot (Experimental)`

## Why Tabs Instead Of Separate Routes

Tabs inside one route are preferred because:

- all performance comparisons stay in one place
- product reviewers can compare modes quickly
- the Bench app remains a single performance surface
- shared timing cards and common controls are easier to reuse

## Bench Tab Requirements

### Flat tab

Use the current actual-path benchmark as the baseline.

Must cover:

- 10k / 50k / 100k row scenarios
- filter row
- row check / delete check
- edit and paste
- pinning and sticky header

### Tree tab

Must cover:

- 1k / 5k / 10k visible nodes
- varying depth
- expand / collapse timing
- selection after collapse
- filter path on tree rows

Suggested metrics:

- visible nodes after shaping
- expand interaction latency
- collapse interaction latency
- selected visible nodes
- max depth

### Group tab

Must cover:

- grouped row count
- business row count
- expand / collapse timing
- filter / sort after grouping

Suggested metrics:

- group row count
- visible grouped rows
- group expand latency
- sort after group latency
- filter after group latency

### Pivot tab

Keep experimental.

Must cover:

- wide-column count
- generated pivot column count
- aggregation time
- horizontal scroll responsiveness

Suggested metrics:

- generated columns
- generated cells
- pivot build time
- horizontal render range

## UI Requirements

Bench should preserve the current product tone but become more explicit about the active mode.

Recommended UI:

- mode tabs at the top
- common metrics row
- mode-specific metrics row
- main grid area
- optional scenario notes panel

## Shared Controls

Common controls that should remain available across tabs:

- scenario size switch
- reset scenario
- clear filters
- build save bundle where meaningful

Mode-specific controls:

- Tree:
  - expand all
  - collapse all
- Group:
  - group by selector
  - expand all groups
  - collapse all groups
- Pivot:
  - pivot dimension selector
  - measure selector

## Browser Validation Requirements

Bench mode changes must keep Playwright coverage.

Required browser checks:

### Flat

- filter row applies
- header menu still works
- paste still works

### Tree

- expand / collapse works by click
- selection remains valid after collapse

### Group

- group rows expand / collapse
- filter and sort still apply

### Pivot

- mode opens
- pivot preview renders
- wide horizontal area remains interactable

## Performance Policy

Do not hardcode strict ms thresholds until enough baseline runs are collected.

Instead:

- expose metrics in the UI
- keep browser smoke paths stable
- compare regressions relative to previous known-good states

## Implementation Order

1. add mode switch shell to Bench
2. keep `Flat` as-is and move it under the new shell
3. add `Tree` tab after tree runtime exists
4. add `Group` tab after group runtime exists
5. add `Pivot (Experimental)` tab only if needed for analytical review

## Final Recommendation

Bench should remain one page, but it should no longer be one mode.

Use one Bench route with four runtime-oriented tabs:

- Flat
- Tree
- Group
- Pivot (Experimental)
