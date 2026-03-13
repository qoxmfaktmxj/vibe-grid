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

## Validation

- `npm run lint`
- `npm run build`
- `CI=1 npm run test:e2e`

## Notes

- Slice 9A/9B are now in place at MVP level.
- Right-click menu open is still deferred.
- Filter row is still the next major part of Slice 9.

## Next Candidates

1. `Slice 9C` filter row
2. filtered-column indicator polish
3. right-click open support
4. width reset and hide behavior edge-case coverage
