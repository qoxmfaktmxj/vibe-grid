# P7 Test and Release Hardening Status

## Completed in the first pass

- Added a stable vs experimental boundary document for shared grid behavior.
- Added hub-level smoke coverage so the main manual verification surfaces are part of the browser regression path.
- Enabled stricter Playwright CI defaults:
  - `forbidOnly` in CI
  - CI retries
  - HTML report output
- Added CI artifact upload for Playwright outputs.

## Validation

- `npm run lint`
- `npm run build`
- `CI=1 npm run test:e2e`

## Notes

- P7 is started, not complete.
- This first pass hardens the repo around:
  - release discipline
  - smoke regression coverage
  - CI observability

## Remaining P7 Work

- expand regression depth for resize, persistence, and compatibility paths
- decide whether cross-browser smoke is worth the cost in CI
- define a concrete internal release routine and changelog rule
- tighten the stable surface further if additional packages become pilot consumers
