# VibeGrid Working Rules

This repository is a shared grid product workspace.

It is not a one-off demo and it is not a page-level table wrapper.

The project exists to build an IBSheet-replacement business grid that can be consumed by multiple apps such as `EHR_6` and later `vibe-hr`.

## 1. Read Order Before Touching Code

Read these files in order before making changes:

1. `README.md`
2. `CHANGELOG.md`
3. `docs/adr/0001-product-scope.md`
4. `docs/development/vibe-grid-development-guide.md`
5. `docs/roadmap/current-execution-plan.md`
6. the latest relevant roadmap docs:
   - `docs/roadmap/slice-8-range-selection-design.md`
   - `docs/roadmap/slice-8-status.md`
   - `docs/roadmap/slice-9-productized-grid-ux-design.md`
   - `docs/roadmap/slice-9-status.md`
   - `docs/roadmap/p5-performance-status.md`
   - `docs/roadmap/p6-product-infrastructure-status.md`
   - `docs/roadmap/p7-test-release-status.md`
7. release discipline docs:
   - `docs/release/public-api-stability.md`
   - `docs/release/release-routine.md`

Do not start from implementation guesses. Start from the product docs, then confirm the actual code.

## 2. What Has Already Been Built

The project has already gone through multiple slices. The current state is not a greenfield scaffold.

### Completed foundation and behavior slices

- `Slice 1` to `Slice 7` are implemented and validated.
- `Slice 8` range selection is implemented and polished to the current pilot-ready level.
- `Slice 9` productized header and filter UX is implemented to the current pilot-ready level.

### What exists right now

- Grid Lab
- Bench
- Compatibility Lab
- row-first business interaction model
- save bundle model
- range selection, copy, and paste overflow policy
- header menu
- filter row
- row virtualization on the actual `VibeGrid` render path
- scoped column-state persistence
- shared i18n catalog
- shared theme tokens
- Playwright browser regression coverage
- release discipline docs and changelog baseline

### Current maturity level

- pilot-ready for internal business-screen evaluation
- not yet fully standard-ready for uncontrolled broad rollout across multiple apps

Use `docs/release/public-api-stability.md` as the source of truth for what is currently stable versus still experimental.

## 3. Product Boundaries

### Internal engine

- `TanStack Table` is an internal engine detail.
- Do not expose TanStack-specific state or types as the public product contract.

### Public contract

- Public shared behavior belongs to `@vibe-grid/core`.
- The main app-facing React surface is `@vibe-grid/react`.

### Do not do this

- do not push app-specific shortcuts into shared packages unless they are intended to become product behavior
- do not let consuming apps depend on TanStack types directly
- do not create one-off lab-only behavior inside shared packages unless it is clearly marked experimental

### Default UX contract

- row-first business UX is the default
- range selection is additive, not a replacement for row workflows
- selection, paste, header behavior, and persistence are shared product behavior once documented as stable

## 4. Where Code Belongs

### `packages/core`

Use for:

- row state
- validation
- save bundle
- selection model
- filter/sort query contracts
- column state model

### `packages/react`

Use for:

- `VibeGrid`
- rendering and interaction wiring
- header/body/editor composition
- sticky/pinned behavior

### `packages/tanstack-adapter`

Use for:

- translating shared contracts into TanStack-specific configuration

### `packages/clipboard`

Use for:

- rectangular paste parsing
- paste overflow policy
- paste validation behavior

### `packages/excel`

Use for:

- xlsx import/export/template behavior

### `packages/persistence`

Use for:

- shared preference adapters
- currently column-state persistence

### `packages/i18n`

Use for:

- shared grid messages
- status and validation copy

### `packages/theme-shadcn`

Use for:

- product theme tokens
- shared visual state values

### `packages/testing`

Use for:

- reusable benchmark and test harness helpers

### `apps/playground`

Use for:

- Grid Lab
- Compatibility Lab
- product behavior validation surfaces

### `apps/bench`

Use for:

- isolated performance validation surfaces when needed

### `tests/e2e`

Use for:

- Playwright browser regression coverage

## 5. Validation Rules

Playwright validation means **real browser interaction verification**.

This is not a snapshot-only check and not a unit-style render check.

It means verifying actual browser behavior such as:

- click
- focus
- keyboard input
- paste
- drag
- sticky reaction
- pinned reaction
- persistence after reload

### Required commands

Run all of these for UI or interaction work:

```powershell
npm run lint
npm run build
$env:CI='1'; npm run test:e2e
```

Recommended full pass:

```powershell
$env:CI='1'; npm run ci
```

Use `CI=1` because:

- it prevents reusing stale local servers
- it matches the repository’s required fresh-browser verification rule
- it exposes regressions hidden by old local Next.js processes

## 6. Current Test Surface

Current Playwright coverage includes:

- hub smoke navigation
- Grid Lab core row workflow
- append paste flow
- reject overflow paste flow
- filter row flow
- keyboard range selection
- drag range selection and copy
- header menu click/right-click behavior
- filter indicator behavior
- pin/hide/sort behavior
- persisted column visibility
- persisted pinning and width behavior
- Bench combined-feature performance path
- Compatibility Lab surface

If you change one of these behaviors, update the corresponding Playwright test.

## 7. Current Release Discipline

Read:

- `docs/release/public-api-stability.md`
- `docs/release/release-routine.md`
- `CHANGELOG.md`

Current release rules:

- Chromium is the required CI browser gate.
- Cross-browser smoke is **not** in default CI yet.
- Cross-browser testing is optional and intentional, not automatic.
- Every meaningful stable change should update `CHANGELOG.md`.

## 8. Current Execution Priority

The current high-level order is tracked in `docs/roadmap/current-execution-plan.md`.

At the moment, the project has already completed the core product behavior work and is now in product-hardening mode.

### Current focus

- P6 product infrastructure finalization
- P7 test/release hardening

### Only after that

- larger feature expansion
- new editor families
- saved views
- code-help editors
- undo/redo
- tree/group support

Do not jump into broad feature expansion without checking whether the current phase is closed first.

## 9. How To Continue Development Safely

### Step 1. Identify the class of work

Before changing code, answer:

- is this product hardening or a new feature?
- does it change a stable surface?
- does it belong in `core`, `react`, or only in a lab app?

### Step 2. Find the owning document

If the work touches:

- range / paste: use Slice 8 docs
- header / filter / product shell: use Slice 9 docs
- performance: use P5 status
- persistence / i18n / theme: use P6 status
- test/release discipline: use P7 status

### Step 3. Inspect code before editing

Do not assume the implementation.

Read the current files first, especially:

- `packages/react/src/VibeGrid.tsx`
- `packages/react/src/internal/*`
- the relevant package under `packages/`
- the relevant test in `tests/e2e/`

### Step 4. Edit the smallest viable surface

Prefer:

- shared contract changes in `core`
- rendering/interactions in `react`
- test surface changes in `apps/playground`

Avoid:

- pushing lab-only shortcuts into shared packages
- widening the public surface accidentally

### Step 5. Update docs with the change

When a slice or phase materially moves:

- update its status doc
- update `docs/roadmap/current-execution-plan.md` if priority shifted
- update `docs/release/public-api-stability.md` if stable/experimental boundaries changed
- update `CHANGELOG.md` if the change is meaningful

### Step 6. Run the required validation

Always:

- `npm run lint`
- `npm run build`
- `$env:CI='1'; npm run test:e2e`

If one of these is skipped, the work is not complete.

## 10. What A New Contributor Should Know Immediately

### Architectural truth

- `@vibe-grid/core` is the product contract
- `@vibe-grid/react` is the main consumer-facing implementation
- TanStack is internal
- Grid Lab is the main verification surface

### Behavioral truth

- this is an IBSheet-replacement project, not a generic data table
- row-first business UX is the default
- paste behavior and overflow policy are already defined product behavior
- header menu and filter row are already treated as part of pilot-ready behavior

### Process truth

- Playwright is mandatory for interaction changes
- documentation and code must stay aligned
- this repo already has history and decisions; do not restart the architecture from scratch

## 11. Current Remaining Work Before Broad Feature Expansion

At the time of this document:

- P6 still has optional cleanup around broader persistence scope and remaining catalog cleanup
- P7 still has optional expansion around regression depth, release routine maturity, and possible cross-browser smoke policy

After those are sufficiently closed, feature expansion can resume.

## 12. If You Are About To Add A New Feature

Before adding it, check:

1. is the current phase already complete?
2. does the feature need a new public contract?
3. does it need a design doc first?
4. does it need Playwright coverage?
5. should it be stable or experimental?

If the answer is unclear, document the decision first.

## 13. Minimum Definition Of Done

A change is done only if:

- code is implemented
- the correct docs are updated
- `CHANGELOG.md` is updated when appropriate
- browser verification passed
- the repo remains aligned with the current execution plan
