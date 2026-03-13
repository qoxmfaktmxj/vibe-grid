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

### Changed

- Header menu, filter row, range selection, paste overflow policy, and row virtualization were raised to pilot-ready behavior.
- Grid status and clipboard fallback copy now flow through `@vibe-grid/i18n`.
- Theme token coverage now includes grid surface, body, row-state badges, inline editors, and sticky/range visuals.
- Playwright CI now records HTML reports and uploads artifacts.
- Grid body cells, side editors, and paste application now share the same editable/readonly rule evaluation.

### Notes

- VibeGrid is pilot-ready for internal business-screen evaluation.
- It is not yet fully standard-ready for uncontrolled broad adoption across multiple apps.
