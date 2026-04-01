<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/virtualization

## Purpose
Virtual row rendering hook wrapping TanStack React Virtual. Provides configurable row height, overscan, and scroll container integration for efficient large-dataset rendering.

## Key Files

| File | Description |
|------|-------------|
| `src/index.ts` | All exports: useVirtualRows, VirtualizationPreset, defaultVirtualizationPreset, DEFAULT_ROW_HEIGHT (42), DEFAULT_HEADER_HEIGHT (44) |

## For AI Agents

### Working In This Directory
- Thin wrapper; keep minimal
- Default overscan: 8 items
- Default row height: 42px, header height: 44px
- Integrates with container scroll element

## Dependencies

### Internal
None

### External
- `@tanstack/react-virtual` — virtual scrolling primitive
- `react`

<!-- MANUAL: -->
