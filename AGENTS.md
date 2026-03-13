# VibeGrid Working Rules

This repository is a product workspace, not a one-off page app.

## Read First

Before changing code, read these files in order:

1. `README.md`
2. `docs/adr/0001-product-scope.md`
3. `docs/development/vibe-grid-development-guide.md`
4. the latest relevant slice docs in `docs/roadmap/`

Minimum roadmap references:

- current execution sequencing:
  - `docs/roadmap/current-execution-plan.md`
- interaction / selection / paste work:
  - `docs/roadmap/slice-8-range-selection-design.md`
  - `docs/roadmap/slice-8-status.md`
- header / filter / productized grid shell work:
  - `docs/roadmap/slice-9-productized-grid-ux-design.md`

## Product Boundaries

- Treat `TanStack Table` as an internal engine, not the public contract.
- Public behavior belongs to `@vibe-grid/core`.
- Do not push app-specific shortcuts into the shared grid packages unless they are meant to become product behavior.
- Preserve row-first business UX unless the current slice explicitly changes that contract.

## Validation Rules

Playwright validation means **real browser interaction verification**.

In this repository, Playwright is not just a unit-style check. It is used to verify real browser behavior such as:

- click
- focus
- keyboard input
- paste
- drag
- sticky and pinned rendering reactions

Browser validation is mandatory for UI and interaction work.

Required:

- `npm run lint`
- `npm run build`
- `CI=1 npm run test:e2e`

Recommended before push:

- `CI=1 npm run ci`

If you changed selection, paste, editing, header behavior, filtering, or styling:

- run Playwright browser validation before pushing
- interpret this as real browser click and event verification, not just static render confirmation
- prefer a fresh server run with `CI=1` so old local dev processes do not hide regressions

## Working Style

- Start from the guide docs, then the slice docs, then code.
- Update the corresponding slice status doc when a slice meaningfully changes.
- Keep tests aligned with the implemented slice. Do not leave silent behavior changes undocumented.
