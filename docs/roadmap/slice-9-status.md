# Slice 9 Status

## Completed

- Split header actions into a product-level menu surface instead of relying only on direct header sort clicks.
- Added a local React header menu state for one-open-at-a-time behavior.
- Added header menu actions for:
  - sort ascending
  - sort descending
  - clear sort
  - pin left
  - pin right
  - unpin
  - hide column
  - reset width
- Added close behavior for:
  - outside pointer down
  - `Escape`
  - action completion
- Added header data attributes and test ids for browser verification:
  - `data-column-key`
  - `data-column-pinned`
  - `data-header-menu-open`
- Added Playwright coverage for:
  - menu open
  - menu close with `Escape`
  - pin action
  - sort action
  - hide action
- Added an in-grid filter row under the sticky header.
- Added filter-row controls for:
  - text filters with explicit apply and clear
  - select filters with immediate apply and clear
  - number filters with numeric validation
- Wired filter-row changes to the server-mode `GridQuery.filters` contract.
- Added Grid Lab browser coverage for:
  - filter row visibility
  - text filter apply
  - filter clear
  - select filter apply
- Added filtered-column header state:
  - per-column filtered data attributes
  - in-header filter count indicator
- Added right-click support for header menu open.

## Validation

- `npm run lint`
- `npm run build`
- `CI=1 npm run test:e2e`

## Notes

- Slice 9A/9B/9C are now in place at MVP level.
- Right-click menu open is implemented.
- Filtered-column indicator polish is implemented at MVP level.

## Next Candidates

1. width reset and hide behavior edge-case coverage
2. filtered and pinned header visual polish under heavy scroll
3. `P6` product infrastructure
