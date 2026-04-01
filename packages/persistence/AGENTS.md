<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/persistence

## Purpose
Browser localStorage adapter for persisting grid column state (visibility, width, pinning, order). Scoped by namespace, appId, userId, and gridId.

## Key Files

| File | Description |
|------|-------------|
| `src/index.ts` | All exports: createBrowserGridPreferenceAdapter, createGridPreferenceStorageKey, types |

## For AI Agents

### Working In This Directory
- Storage key format: `namespace:appId:userId:gridId:segment`
- Default scope: `vibe-grid` namespace, `anonymous` user
- Methods: getColumnState, setColumnState, clearColumnState
- JSON serialization for storage

## Dependencies

### Internal
- `@vibe-grid/core` — GridColumnState type

### External
None

<!-- MANUAL: -->
