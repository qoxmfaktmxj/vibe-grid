<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/excel

## Purpose
Excel import/export functionality. Creates XLSX workbooks with data + hidden schema sheets, validates headers on import, and provides template generation.

## Key Files

| File | Description |
|------|-------------|
| `src/index.ts` | All exports: exportRowsToExcelBuffer, createExcelTemplateBuffer, importExcelPreview, createGridExcelSchema, validateExactHeaders |

## For AI Agents

### Working In This Directory
- Workbooks use dual-sheet structure: data sheet + hidden schema sheet with version tracking
- Import returns async preview with parsed rows and validation results
- Lazy-loaded in playground via `excel-client.ts` to avoid bundle bloat

### Common Patterns
- Async operations (file I/O)
- Schema-driven column mapping with custom parsers

## Dependencies

### Internal
- `@vibe-grid/core` — VibeGridColumn type

### External
- `exceljs` — Excel workbook creation/parsing

<!-- MANUAL: -->
