# Slice 6 Status

## Completed

- Fixed the hub copy so the current screen strategy is reflected correctly.
- Marked Compatibility Lab as a later slice and kept Scenario Regression inside Grid Lab.
- Added grid-level column state contracts:
  - visibility
  - sizing
  - ordering
  - pinning
- Added a server-query sample route for:
  - filtering
  - sorting
  - pagination
- Prepared editor metadata in the public column contract so the side form can grow into a reusable editor set.

## Current Focus

Grid Lab is now the main surface for:

1. local row mutation workflow
2. server query/filter/sort/page flow
3. column feature validation

## Next Slice

1. richer editor set inside the grid body
2. Compatibility Lab real scenarios
3. automated regression tests
4. filter-row and header menu UX
