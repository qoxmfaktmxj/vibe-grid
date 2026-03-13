# P6 Product Infrastructure Status

## Completed in the first pass

- Replaced ad hoc `localStorage` access in Grid Lab with a shared persistence adapter.
- Introduced a scoped preference key model based on:
  - `appId`
  - `userId`
  - `gridId`
- Connected header menu labels to the shared i18n catalog.
- Connected header and menu visual states to shared theme tokens.
- Added browser regression coverage for persisted column visibility after reload.

## Completed in the second pass

- Normalized Grid Lab status copy through `@vibe-grid/i18n`.
- Normalized shared clipboard fallback validation messages through `@vibe-grid/i18n`.
- Added a shared message formatter for placeholder-based status and validation text.
- Expanded shared theme tokens into:
  - grid surface
  - body rows and empty states
  - row-state badges
  - inline editors
  - sticky boundary and range outline visuals

## Validation

- `npm run lint`
- `npm run build`
- `CI=1 npm run test:e2e`

## Notes

- P6 is in progress, not complete.
- This pass productizes the first visible edges:
  - persistence
  - menu labels
  - header/menu theme tokens
-  - Grid Lab status and clipboard fallback messages
-  - Grid Lab status and clipboard fallback messages
-  - body/editor/state badge theme tokens
- Remaining P6 work still includes:
  - locale strategy beyond the default catalog
  - deciding whether non-grid lab shell panels should use shared product tokens
  - expanding persistence beyond column state if product behavior requires it

## Next Candidates

1. expand persistence from column state to wider view preferences if needed
2. decide whether lab shell cards and side panels belong in shared theme scope
3. move broader validation and lab copy into the shared catalog where it still leaks
