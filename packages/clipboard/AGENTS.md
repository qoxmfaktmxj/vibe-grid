<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/clipboard

## Purpose
Clipboard paste/copy operations with rectangular matrix parsing, overflow policy enforcement, and cell-level validation. Handles TSV data from system clipboard and produces structured paste plans.

## Key Files

| File | Description |
|------|-------------|
| `src/index.ts` | All exports: buildRectangularPastePlan, summarizeRectangularPastePlan, parseTsv, createClipboardSchema, types |

## For AI Agents

### Working In This Directory
- Paste plans distinguish between existing-row patches and appended rows
- Overflow policies: `reject` (block) or `append` (add new rows)
- Skip reasons: emptyMatrix, missingAnchor, columnOverflow, rowOverflow, hidden, readonly, validation
- Validation errors track row/column offsets for precise error reporting

### Common Patterns
- Pure functions, no React dependency
- TSV parsing from tab-separated clipboard text
- Cell-by-cell validation with detailed skip tracking

## Dependencies

### Internal
- `@vibe-grid/core` — grid types, editability checks
- `@vibe-grid/i18n` — localized error messages

### External
None

<!-- MANUAL: -->
