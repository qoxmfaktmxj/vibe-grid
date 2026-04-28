# Changelog

All meaningful changes to the shared VibeGrid product should be recorded here.

## [0.1.0] - 2026-04-28

## Unreleased

### Added

- Core test coverage for `@vibe-grid/excel`, `@vibe-grid/persistence`, and `@vibe-grid/clipboard` helper edge cases.
- Shared density option on `VibeGrid` with `compact`, `default`, and `comfortable` modes, plus density comparison controls in Grid Lab and Bench.
- Real-grid performance verification with actual `VibeGrid` render-path coverage.
- Stable vs experimental boundary documentation.
- Hub smoke regression coverage.
- Experimental bulk orchestration contracts in `@vibe-grid/core` for exact-selection snapshots, mutation execution plans, and sync/async execution result validation.
- Experimental headless `useGridBulkOrchestration` hook in `@vibe-grid/react`.
- Employee Batch lab for validating a 15,000-row employee list, exact 10,000-row selection snapshots, sync/async host action execution, and delete/update/insert plan preview.
- Scoped persistence adapter and initial product infrastructure.
- Row-aware cell editability as a shared grid contract.
- Dedicated delete-check control column with shared browser-tested delete-toggle behavior.
- Single-click edit activation as an opt-in shared grid behavior.
- Paste summary and skip reporting polish with shared clipboard-plan summarization.
- Date editor foundation with calendar popover, disabled-date rules, and badge-aware day rendering.
- Shared date-policy helpers in `@vibe-grid/core` for host-provided holiday and business-calendar wiring.
- Direct in-grid clipboard paste entry on the shared `VibeGrid` surface, wired to the existing range-aware paste engine.
- HeaderCheck-style rowCheck column with header all-check and bench/browser coverage.
- Experimental public event handlers for paste, save, and row-copy flows.
- Experimental group/tree/pivot preview helpers and compatibility demos.
- Experimental tree runtime contracts in `@vibe-grid/core`, including expanded-row state helpers.
- Experimental tree runtime rendering on the shared `VibeGrid` React surface, with Compatibility Lab browser coverage.

### Infrastructure

- vibe-grid 모노레포의 9개 패키지를 npm public registry에 publish 가능하도록 빌드/메타/워크플로우 정비
- `tsc` 단독 빌드, dual-resolution `exports`, tag-driven `release.yml` (provenance)
- 자세한 설계: `docs/superpowers/specs/2026-04-27-vibe-grid-npm-publish-design.md`

### Fixed

- `VibeGridDateEditor`의 `formatIsoDate`가 `toISOString()`(UTC 기준) 대신 `getFullYear/getMonth/getDate`(로컬 타임존 기준)를 사용하도록 수정 — KST(UTC+9) 환경에서 자정 근처 날짜가 하루 밀리는 버그 해결.

### Changed

- Filter row(`VibeGridFilterRow`)의 "Apply", "Clear", "All" 레이블을 `@vibe-grid/i18n` 키(`grid.filter.*`)로 교체 — ko-KR 기준 "적용", "초기화", "전체"로 표시됨.
- Date editor(`VibeGridDateEditor`)의 버튼/범례 텍스트("Cal", "Prev", "Next", "Clear", "Weekend", "Holiday", "Special")와 요일 레이블을 `@vibe-grid/i18n` 및 `Intl.DateTimeFormat`(defaultLocale 기준)으로 교체.
- `@vibe-grid/i18n`에 filter(3개) + dateEditor(8개) 관련 메시지 키 추가 (ko-KR / en-US 모두 지원).

- Added an AI-facing consumption guide for reusing `VibeGrid` packages from external workspaces such as `EHR_6`.
- Hub navigation now exposes the Employee Batch validation surface, and root `ci` now runs the lightweight core/react unit test pass before Playwright.

- Bench 화면 문구와 벤치 더미 데이터를 한국어 기준으로 정리했고, Compatibility Lab은 IBSheet8 매뉴얼 기준 매트릭스로 최신화했다.
- Compatibility Lab now reflects the current HeaderCheck, public-event, and Group/Tree/Pivot experimental state.
- Header menu, filter row, range selection, paste overflow policy, and row virtualization were raised to pilot-ready behavior.
- Grid status and clipboard fallback copy now flow through `@vibe-grid/i18n`.
- Theme token coverage now includes grid surface, body, row-state badges, inline editors, and sticky/range visuals.
- Grid surface styling now follows the editorial tonal-layering direction translated from the Stitch design references.
- Styling work now has explicit performance guardrails and a bench checklist for before/after review.
- Bench now exposes the current runtime grid profile, and the shared row height was tightened to a 42px baseline for denser data display.
- Bench now focuses on the actual `VibeGrid` path only, and the bench grid supports direct paste into editable cells.
- Bench now also supports delete-check toggles, filter reset, scenario reset, and save-bundle preview so CRUD-like performance flows can be exercised on the real grid path.
- Shift-click range selection now preserves the original anchor while Shift remains held across continued cell clicks.
- Playwright CI now records HTML reports and uploads artifacts.
- Grid body cells, side editors, and paste application now share the same editable/readonly rule evaluation.
- Shared selection navigation now reuses row/column index maps, drag-range updates commit at frame cadence, and column resize state persists on drag end instead of every move.
- Internal control-column renderers now read row meta through a ref-backed lookup instead of recreating column definitions on every row-meta change.
- Filter-row draft synchronization now avoids key-based remounts when visible columns or active filters change.

### Notes

- VibeGrid is pilot-ready for internal business-screen evaluation.
- It is not yet fully standard-ready for uncontrolled broad adoption across multiple apps.
