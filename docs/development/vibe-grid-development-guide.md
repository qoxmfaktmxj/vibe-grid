# VibeGrid Development Guide

## Why this guide exists

VibeGrid is not a page-level table wrapper. It is an internal grid product intended to replace IBSheet-style business grids across multiple apps.

That means new work should start from the product contract and current slice status, not from guesswork or one-off page needs.

## Start Here

Before touching code, read these documents:

1. [README](C:/Users/kms/Desktop/dev/vibe-grid/README.md)
2. [ADR 0001 Product Scope](C:/Users/kms/Desktop/dev/vibe-grid/docs/adr/0001-product-scope.md)
3. latest slice status in `docs/roadmap/`
4. relevant active design docs

Current high-priority references:

- [Current Execution Plan](C:/Users/kms/Desktop/dev/vibe-grid/docs/roadmap/current-execution-plan.md)
- [Slice 8 Range Selection Design](C:/Users/kms/Desktop/dev/vibe-grid/docs/roadmap/slice-8-range-selection-design.md)
- [Slice 8 Status](C:/Users/kms/Desktop/dev/vibe-grid/docs/roadmap/slice-8-status.md)
- [Slice 9 Productized Grid UX Design](C:/Users/kms/Desktop/dev/vibe-grid/docs/roadmap/slice-9-productized-grid-ux-design.md)
- [Slice 9 Status](C:/Users/kms/Desktop/dev/vibe-grid/docs/roadmap/slice-9-status.md)

## Working Agreement

### 1. Public contract first

- `@vibe-grid/core` is the source of truth for shared grid state and contracts.
- `@vibe-grid/react` should express the product behavior, not app-specific hacks.
- `TanStack Table` stays internal.

### 2. Slice-first implementation

Before coding, decide which slice the work belongs to.

Questions to answer:

- Is this foundation work, polish work, or a new UX capability?
- Which existing slice status should be updated after the change?
- Does the work change a public grid rule that other apps will inherit?

### 3. Browser validation is mandatory

In this repository, Playwright validation means **real browser click and event verification**.

This includes verifying actual browser behavior such as:

- click
- focus movement
- keyboard input
- paste
- drag
- sticky and pinned reactions

If the work touches any of these, browser testing is required:

- selection
- copy/paste
- editing
- header behavior
- filter behavior
- sticky or pinned rendering
- styling/layout

Required commands:

```powershell
npm run lint
npm run build
$env:CI='1'; npm run test:e2e
```

Recommended full verification:

```powershell
$env:CI='1'; npm run ci
```

Why `CI=1`:

- it disables Playwright web server reuse
- it avoids false positives from stale local Next.js processes
- it validates against a fresh production-style server

## When to use Playwright manually

Automated E2E is required, but for interaction-heavy work also do a quick manual browser pass when possible.

Recommended for:

- drag selection
- sticky/frozen layout changes
- paste or clipboard edge cases
- header menu positioning
- filter row alignment

This is intended as real browser interaction checking, not just confirming that a page rendered.

If using Playwright CLI, snapshot before interacting and re-snapshot after significant UI changes.

## Change Checklist

Before starting:

- identify the slice
- read the relevant design/status docs
- confirm whether the change belongs in `core`, `react`, or only `apps/playground`

Before pushing:

- update or add tests
- update the slice status doc when the slice meaningfully moved
- run browser validation
- push only after fresh verification passes

## Where things belong

### `packages/core`

- contracts
- selection state
- row state
- validation
- save bundle model

### `packages/react`

- grid rendering
- interaction wiring
- visual states
- header/body behavior

### `apps/playground`

- product lab flows
- manual verification surface
- scenario validation

### `tests/e2e`

- regression coverage for stable product behavior

## Current caution areas

- range selection is in foundation stage; do not assume the UX is fully stabilized yet
- header menu and filter row are planned but not yet product-complete
- sticky + pinned + future range overlay will need careful browser verification
