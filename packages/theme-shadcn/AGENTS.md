<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/theme-shadcn

## Purpose
Theme system providing design tokens for the grid. Features a factory function `createVibeGridTheme()` that auto-derives all color states (selection, hover, active, row states) from a single primary color.

## Key Files

| File | Description |
|------|-------------|
| `src/index.ts` | All exports: createVibeGridTheme, vibeGridThemeTokens (default navy #001641), VibeGridThemeTokens type, vibeGridSurfaceClassName |

## For AI Agents

### Working In This Directory
- Default primary color: `#001641` (navy blue)
- Color derivation uses hex manipulation (hexToRgb, rgba, lighten, darken)
- Token sections: typography, surface, header, indicator, menu, filter, body, sticky, editor, rowState
- Row state colors: N=normal, I=inserted (blue), U=updated (amber), D=deleted (red)
- Styling changes require bench verification

## Dependencies

### Internal
None

### External
None

<!-- MANUAL: -->
