# Changelog

All meaningful changes to the shared VibeGrid product should be recorded here.

## Unreleased

### Added

- Real-grid performance verification with actual `VibeGrid` render-path coverage.
- Stable vs experimental boundary documentation.
- Hub smoke regression coverage.
- Scoped persistence adapter and initial product infrastructure.
- Row-aware cell editability as a shared grid contract.
- Dedicated delete-check control column with shared browser-tested delete-toggle behavior.
- Single-click edit activation as an opt-in shared grid behavior.
- Paste summary and skip reporting polish with shared clipboard-plan summarization.
- Date editor foundation with calendar popover, disabled-date rules, and badge-aware day rendering.
- Shared date-policy helpers in `@vibe-grid/core` for host-provided holiday and business-calendar wiring.
- Direct in-grid clipboard paste entry on the shared `VibeGrid` surface, wired to the existing range-aware paste engine.

### Changed

- Header menu, filter row, range selection, paste overflow policy, and row virtualization were raised to pilot-ready behavior.
- Grid status and clipboard fallback copy now flow through `@vibe-grid/i18n`.
- Theme token coverage now includes grid surface, body, row-state badges, inline editors, and sticky/range visuals.
- Grid surface styling now follows the editorial tonal-layering direction translated from the Stitch design references.
- Styling work now has explicit performance guardrails and a bench checklist for before/after review.
- Bench now exposes the current runtime grid profile, and the shared row height was tightened to a 42px baseline for denser data display.
- Bench now focuses on the actual `VibeGrid` path only, and the bench grid supports direct paste into editable cells.
- Shift-click range selection now preserves the original anchor while Shift remains held across continued cell clicks.
- Playwright CI now records HTML reports and uploads artifacts.
- Grid body cells, side editors, and paste application now share the same editable/readonly rule evaluation.
- Shared selection navigation now reuses row/column index maps, drag-range updates commit at frame cadence, and column resize state persists on drag end instead of every move.
- Internal control-column renderers now read row meta through a ref-backed lookup instead of recreating column definitions on every row-meta change.
- Filter-row draft synchronization now avoids key-based remounts when visible columns or active filters change.

### Notes

- VibeGrid is pilot-ready for internal business-screen evaluation.
- It is not yet fully standard-ready for uncontrolled broad adoption across multiple apps.
