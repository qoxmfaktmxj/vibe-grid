<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/react

## Purpose
Main consumer-facing React component library. Provides the `VibeGrid` component with full CRUD, selection, filtering, sorting, clipboard, inline editing, virtualization, and header menu capabilities. This is the primary public surface for app consumers.

## Key Files

| File | Description |
|------|-------------|
| `src/index.ts` | Barrel export: VibeGrid, VibeGridPlaceholder, resolveGridDensityMetrics, createVibeGridTheme, useGridBulkOrchestration |
| `src/VibeGrid.tsx` | Main grid component (~32KB) with full state management, keyboard/clipboard handling, virtualization |
| `src/useGridBulkOrchestration.ts` | Hook for bulk mutation: planning, async execution, selection snapshots |
| `src/useGridBulkOrchestration.test.ts` | Unit tests for bulk orchestration hook |
| `src/grid-density.ts` | Density metric mappings (compact, default, comfortable) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/internal/` | Internal sub-components not exported publicly (see `src/internal/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `VibeGrid.tsx` is the core file; read it carefully before modifying
- Internal components in `src/internal/` are not part of the public API
- Do not expose TanStack-specific types or state as public contract
- All interaction wiring (keyboard, mouse, clipboard) lives here

### Testing Requirements
- Unit tests via `npm run test:core`
- E2E interaction tests via Playwright against `apps/playground`
- Any UI/interaction change needs corresponding Playwright spec update

### Common Patterns
- Props-driven configuration (columns, rows, handlers)
- Internal state managed via React hooks
- Keyboard shortcuts handled in VibeGrid's event handlers
- Theme tokens applied via CSS custom properties

## Dependencies

### Internal
- `@vibe-grid/core` — state contracts, selection, validation
- `@vibe-grid/i18n` — grid messages
- `@vibe-grid/tanstack-adapter` — column definition translation
- `@vibe-grid/theme-shadcn` — theme tokens
- `@vibe-grid/virtualization` — virtual row rendering

### External
- `@tanstack/react-table` — table engine (internal detail)
- `react` — UI framework

<!-- MANUAL: -->
