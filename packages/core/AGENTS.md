<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/core

## Purpose
Foundational contract layer for the entire VibeGrid product. Contains all shared business logic: row state management, selection model, validation, save bundles, column state, edit sessions, bulk orchestration, tree/group/pivot, date policy, commands, and events. Has zero internal or external dependencies.

## Key Files

| File | Description |
|------|-------------|
| `src/index.ts` | Barrel export for all public APIs |
| `src/contracts.ts` | Core type definitions (GridActiveCell, VibeGridColumn, ManagedGridRow, RowState, SaveBundle, GridFilter, GridSortRule, GridQuery, etc.) |
| `src/row-state.ts` | Row lifecycle: createLoadedRow, createInsertedRow, applyRowPatch, markRowsSaved, toggleRowDeleted, buildSaveBundle |
| `src/selection.ts` | Selection model: activateRow, beginRangeSelection, extendRangeByArrow, moveActiveCellByArrow, toggleRowSelection |
| `src/column-state.ts` | Column state: createGridColumnState, moveGridColumn, setGridColumnPinning/Visibility/Width |
| `src/edit-session.ts` | Cell editing: beginEditSession, updateEditSessionDraft, clearEditSession, isEditingCell |
| `src/validation.ts` | Row validation: validateRow, validateManagedRows, withRowValidation, countValidationIssues |
| `src/bulk-orchestration.ts` | Bulk operations: buildGridMutationExecutionPlan, createGridBulkOrchestrationRequest, createGridSelectionSnapshot |
| `src/bulk-orchestration.test.ts` | Unit tests for bulk orchestration |
| `src/tree.ts` | Tree hierarchy: createGridTreeState, shapeGridTreeRows, toggleGridTreeRowExpanded |
| `src/date-policy.ts` | Date field constraints: createGridDatePolicy, createGridDateEditorSpec, createGridDateValidators |
| `src/commands.ts` | Command registry: GRID_COMMAND_IDS, createDefaultCommandRegistry, getGridCommand |
| `src/events.ts` | Event emission: emitGridAfterPaste, emitGridAfterRowCopy, emitGridAfterSave |
| `src/benchmark.ts` | Performance helpers: createBenchmarkRow, createBenchmarkRows, createBenchmarkSnapshot |
| `src/experimental-views.ts` | Experimental: buildGridGroupPreview, buildGridPivotPreview, flattenGridTree |

## For AI Agents

### Working In This Directory
- This is the product contract; changes here affect all downstream packages
- All functions are pure (no React, no DOM, no side effects)
- Types and contracts must remain TanStack-agnostic
- New shared behavior starts here before wiring into `react`

### Testing Requirements
- Unit tests run via `npm run test:core` (Node built-in test runner)
- Test files: `*.test.ts` alongside source files
- Compiled via `tsconfig.test.json` before execution

### Common Patterns
- Immutable state updates (return new objects, never mutate)
- Row state uses `RowState` enum: N (normal), I (inserted), U (updated), D (deleted)
- Selection state is a standalone object, not tied to React state

## Dependencies

### Internal
None (foundational package)

### External
None

<!-- MANUAL: -->
