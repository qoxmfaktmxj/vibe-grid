<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# internal

## Purpose
Internal sub-components of `@vibe-grid/react` that are NOT part of the public API. These handle the visual rendering of specific grid sections (header, body, filter row, editors, menus).

## Key Files

| File | Description |
|------|-------------|
| `VibeGridTableHeader.tsx` | Header rendering with sort indicators, filter state, pin/hide controls, resize handles |
| `VibeGridTableBody.tsx` | Body row rendering with virtualization integration, row state styling |
| `VibeGridFilterRow.tsx` | Filter row UI with per-column filter editors |
| `VibeGridHeaderMenu.tsx` | Header context menu (sort, pin, hide, reset width actions) |
| `VibeGridInlineEditor.tsx` | Inline cell editor component for text/number/select editing |
| `VibeGridDateEditor.tsx` | Date-specific editor with business day policy support |

## For AI Agents

### Working In This Directory
- These components are internal; do not export from `@vibe-grid/react`
- They receive props from parent `VibeGrid.tsx`
- Header menu uses `data-*` attributes for Playwright targeting
- Filter row integrates with grid query contracts from `@vibe-grid/core`

### Testing Requirements
- Tested indirectly via Playwright E2E (grid-lab.spec.ts, grid-header-menu.spec.ts)
- Use `data-testid` and `data-column-*` attributes for reliable element targeting

<!-- MANUAL: -->
