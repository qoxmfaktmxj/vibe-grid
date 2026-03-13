# Release Routine

## Purpose

This document defines the internal release routine for VibeGrid while the repo is still private and pilot-oriented.

The goal is not public package publishing yet. The goal is repeatable internal delivery with a clear rule for:

- what can change
- what needs browser verification
- how to record change history
- how to roll forward or back safely

## Release Types

### 1. Pilot Patch

Use this when:

- fixing regressions
- tightening tests
- adjusting styling without changing the public contract
- improving diagnostics or documentation

Expectations:

- update `CHANGELOG.md`
- run full validation
- push to `master`

### 2. Pilot Feature

Use this when:

- adding a new stable capability to `@vibe-grid/core` or `@vibe-grid/react`
- expanding a stable workflow such as filter row, header menu, paste behavior, or virtualization

Expectations:

- update the relevant roadmap status doc
- update `docs/release/public-api-stability.md` if the stable surface changed
- update `CHANGELOG.md`
- run full validation

### 3. Experimental Change

Use this when:

- touching benchmark-only behavior
- adjusting theme token internals
- changing lab shell behavior
- prototyping a future feature not yet on the stable surface

Expectations:

- document the change in roadmap docs or `CHANGELOG.md`
- do not describe it as stable unless the stability doc is updated

## Required Validation Before Push

Always run:

```powershell
npm run lint
npm run build
$env:CI='1'; npm run test:e2e
```

If the change affects:

- selection
- paste
- editing
- filter row
- header menu
- sticky/pinned layout
- persistence

Then the change is not complete without Playwright browser verification.

## CI Policy

### Current CI Default

- Chromium only
- retries enabled in CI
- Playwright HTML report output enabled
- Playwright artifacts uploaded on every CI run

### Cross-Browser Decision

Current decision:

- do **not** run Firefox/WebKit in default CI yet

Reason:

- the repo is still pilot-stage
- most failures so far have been product logic regressions, not engine-specific issues
- CI cost and runtime do not justify full browser expansion yet

Current rule:

- Chromium remains the required gate
- cross-browser smoke can be run intentionally when sticky/layout or focus behavior changes in ways likely to vary by engine

## Changelog Rule

Every meaningful push to `master` should update `CHANGELOG.md` if it changes one of these:

- stable behavior
- tests
- release process
- documentation required for new contributors

Do not wait for a future “real release” to document important changes.

## Rollback Rule

If a change breaks a stable path:

1. revert or patch quickly on top of `master`
2. record the correction in `CHANGELOG.md`
3. keep the roadmap status aligned with reality

Do not leave roadmap docs claiming a feature is complete when rollback removed it.
