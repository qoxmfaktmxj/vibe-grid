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

## Validation

- `npm run lint`
- `npm run build`
- `CI=1 npm run test:e2e`

## Notes

- Slice 9A/9B/9C are now in place at MVP level.
- Right-click menu open is still deferred.
- Filtered-column indicator polish is still deferred.

## Next Candidates

1. filtered-column indicator polish
2. right-click open support
3. width reset and hide behavior edge-case coverage
4. `Slice 8` range selection polish
