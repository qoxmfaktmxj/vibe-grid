<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# design

## Purpose
Visual design specifications, performance guardrails for styling changes, and design translation references.

## Key Files

| File | Description |
|------|-------------|
| `stitch-design-translation.md` | Visual design reference for grid styling |
| `design-performance-guardrails.md` | Performance risk levels for CSS properties; mandatory bench verification rules |

## For AI Agents

### Working In This Directory
- Low-risk CSS: colors, borders, spacing, fonts
- High-risk CSS: backdrop-filter, overlays, shadows, per-cell effects
- All styling changes require bench verification
- Read `design-performance-guardrails.md` before any visual changes

<!-- MANUAL: -->
