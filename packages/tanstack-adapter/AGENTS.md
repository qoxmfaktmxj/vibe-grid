<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/tanstack-adapter

## Purpose
Translation layer that converts VibeGridColumn definitions into TanStack React Table ColumnDef format. Keeps TanStack as an internal implementation detail.

## Key Files

| File | Description |
|------|-------------|
| `src/index.ts` | Single export: createTanStackColumns — maps grid columns to TanStack column defs with sizing, sorting, visibility, and custom meta |

## For AI Agents

### Working In This Directory
- This is a thin mapping layer; keep it minimal
- TanStack types must not leak into the public API
- Custom meta attaches grid-specific features (editable, filterable, editor, filterEditor)

## Dependencies

### Internal
- `@vibe-grid/core` — VibeGridColumn, GridEditableRule types

### External
- `@tanstack/react-table` — ColumnDef type

<!-- MANUAL: -->
