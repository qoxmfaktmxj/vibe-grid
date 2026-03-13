# P7 Test and Release Hardening Status

## Completed in the first pass

- Added a stable vs experimental boundary document for shared grid behavior.
- Added hub-level smoke coverage so the main manual verification surfaces are part of the browser regression path.
- Enabled stricter Playwright CI defaults:
  - `forbidOnly` in CI
  - CI retries
  - HTML report output
- Added CI artifact upload for Playwright outputs.
- Expanded browser regression coverage for:
  - persisted pinning after reload
  - persisted width after reload
  - richer Compatibility Lab assertions
- Added a concrete release routine and changelog rule.
- Explicitly decided to keep Chromium as the default CI browser and leave cross-browser smoke as an opt-in manual activity.

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
  - resize/persistence regression depth

## Remaining P7 Work

- expand regression depth for additional persistence paths if product scope widens beyond column state
- revisit cross-browser smoke only if sticky/focus regressions begin to appear outside Chromium
- tighten the stable surface further if additional packages become pilot consumers
