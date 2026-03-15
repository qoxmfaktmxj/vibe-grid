# P5 Performance Status

## Completed

- Added an actual `VibeGrid` performance lab on the real render path.
- Kept the raw virtualization baseline and the actual product-path benchmark on the same bench page.
- Added explicit interaction timing cards for:
  - scenario switch
  - selection interaction
  - filter interaction
  - sort interaction
  - column interaction
- Exposed runtime grid diagnostics for Playwright:
  - `data-virtualized`
  - `data-total-row-count`
  - `data-rendered-row-count`
  - `data-filter-count`
  - `data-pinned-left-count`
  - `data-pinned-right-count`
- Added Playwright regression coverage for combined-feature interactions on `/labs/bench`:
  - 100k scenario load
  - range selection
  - filter row interaction
  - header menu open and pin-right action
- Removed repeated linear index lookups from shared selection navigation and range normalization when React already has row/column index maps.
- Limited drag-range selection commits to animation-frame cadence instead of pushing React state on every mousemove.
- Switched shared column resize persistence commits from continuous `onChange` updates to end-of-drag `onEnd` commits.
- Kept control-column metadata reads off the column-definition memo path so row meta changes do not recreate the internal control column definitions.
- Replaced filter-row key remount sync with effect-based draft synchronization so filter apply/clear paths do not recreate the full filter-row subtree.

## Validation

- `npm run lint`
- `npm run build`
- `CI=1 npm run test:e2e`

## Notes

- P5 is now beyond a baseline-only bench.
- We now verify combined feature behavior on the actual `VibeGrid` path, not just a synthetic row list.
- The remaining work is interpretation and policy, not missing instrumentation:
  - set acceptable latency targets
  - decide whether to gate CI on hard timing thresholds
  - continue manual browser checks for sticky/pinned edge cases

## Next Candidates

1. define target latency bands for scenario switch, filter, and pin interactions
2. add filtered-column indicator and right-click header menu polish
3. move to `P6` product infrastructure
