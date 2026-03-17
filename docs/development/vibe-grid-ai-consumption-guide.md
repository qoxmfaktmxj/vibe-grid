# VibeGrid AI Consumption Guide

## Purpose

This guide is for AI agents and developers who need to:

- consume `VibeGrid` from another project such as `EHR_6`
- extend `VibeGrid` without breaking the shared product contract
- know which folders matter and which do not

This is not a generic React table. It is a shared IBSheet-replacement grid product.

## Read This Before Integrating

Read in this order:

1. [C:\Users\kms\Desktop\dev\vibe-grid\AGENTS.md](C:\Users\kms\Desktop\dev\vibe-grid\AGENTS.md)
2. [C:\Users\kms\Desktop\dev\vibe-grid\README.md](C:\Users\kms\Desktop\dev\vibe-grid\README.md)
3. [C:\Users\kms\Desktop\dev\vibe-grid\docs\release\public-api-stability.md](C:\Users\kms\Desktop\dev\vibe-grid\docs\release\public-api-stability.md)
4. [C:\Users\kms\Desktop\dev\vibe-grid\docs\roadmap\current-execution-plan.md](C:\Users\kms\Desktop\dev\vibe-grid\docs\roadmap\current-execution-plan.md)
5. [C:\Users\kms\Desktop\dev\vibe-grid\docs\development\vibe-grid-development-guide.md](C:\Users\kms\Desktop\dev\vibe-grid\docs\development\vibe-grid-development-guide.md)

Do not start from `apps/playground` and copy code from there into another app. `playground` is a lab surface, not the package API.

## What To Reuse

If another project wants to use the current grid, reuse the package layer under:

- [C:\Users\kms\Desktop\dev\vibe-grid\packages](C:\Users\kms\Desktop\dev\vibe-grid\packages)

### Required packages

- [C:\Users\kms\Desktop\dev\vibe-grid\packages\core](C:\Users\kms\Desktop\dev\vibe-grid\packages\core)
- [C:\Users\kms\Desktop\dev\vibe-grid\packages\react](C:\Users\kms\Desktop\dev\vibe-grid\packages\react)
- [C:\Users\kms\Desktop\dev\vibe-grid\packages\tanstack-adapter](C:\Users\kms\Desktop\dev\vibe-grid\packages\tanstack-adapter)
- [C:\Users\kms\Desktop\dev\vibe-grid\packages\virtualization](C:\Users\kms\Desktop\dev\vibe-grid\packages\virtualization)
- [C:\Users\kms\Desktop\dev\vibe-grid\packages\i18n](C:\Users\kms\Desktop\dev\vibe-grid\packages\i18n)
- [C:\Users\kms\Desktop\dev\vibe-grid\packages\theme-shadcn](C:\Users\kms\Desktop\dev\vibe-grid\packages\theme-shadcn)

### Usually needed in a real app

- [C:\Users\kms\Desktop\dev\vibe-grid\packages\clipboard](C:\Users\kms\Desktop\dev\vibe-grid\packages\clipboard)
- [C:\Users\kms\Desktop\dev\vibe-grid\packages\persistence](C:\Users\kms\Desktop\dev\vibe-grid\packages\persistence)
- [C:\Users\kms\Desktop\dev\vibe-grid\packages\excel](C:\Users\kms\Desktop\dev\vibe-grid\packages\excel)

### Not required for app consumption

- [C:\Users\kms\Desktop\dev\vibe-grid\apps\playground](C:\Users\kms\Desktop\dev\vibe-grid\apps\playground)
- [C:\Users\kms\Desktop\dev\vibe-grid\apps\bench](C:\Users\kms\Desktop\dev\vibe-grid\apps\bench)
- [C:\Users\kms\Desktop\dev\vibe-grid\packages\testing](C:\Users\kms\Desktop\dev\vibe-grid\packages\testing)

## Recommended Integration Shape

For `EHR_6`, the cleanest structure is:

```text
C:\Users\kms\Desktop\dev\EHR_6
  package.json
  ehr-next
  vendor
    vibe-grid
      packages
        core
        react
        tanstack-adapter
        virtualization
        i18n
        theme-shadcn
        clipboard
        persistence
        excel
```

### Why this shape

- internal `@vibe-grid/*` package references keep working
- updates from `vibe-grid` can be merged with less file-level drift
- the consuming app does not need to copy code from lab screens

## Workspace Rule

Do not copy only `src/` folders.

Copy the full package folders including each `package.json`.

The packages are designed as workspace packages. If you consume them in another project, create a workspace root there.

### Example root `package.json`

```json
{
  "name": "ehr-6-workspace",
  "private": true,
  "workspaces": [
    "ehr-next",
    "vendor/vibe-grid/packages/*"
  ]
}
```

## How The App Should Import The Grid

The consuming app should import from `@vibe-grid/react` and `@vibe-grid/core`.

Do not import TanStack types or hooks directly in the app unless you are intentionally changing the grid product itself.

### Normal app-side import

```ts
import { VibeGrid } from "@vibe-grid/react";
import type {
  GridColumnState,
  GridSelectionState,
  ManagedGridRow,
  VibeGridColumn,
} from "@vibe-grid/core";
```

### Do not do this in consuming apps

```ts
import { useReactTable } from "@tanstack/react-table";
```

If the app needs TanStack-specific changes, that change probably belongs in `vibe-grid`, not in the consumer app.

## Stable Versus Experimental

Before using a feature in another project, check:

- [C:\Users\kms\Desktop\dev\vibe-grid\docs\release\public-api-stability.md](C:\Users\kms\Desktop\dev\vibe-grid\docs\release\public-api-stability.md)

As of now:

### Stable for pilot use

- `VibeGrid`
- row-first selection
- header menu
- filter row
- range selection / range copy / paste overflow policy
- row virtualization
- delete-check column
- rowCheck header check
- date editor foundation
- density option:
  - `compact`
  - `default`
  - `comfortable`

### Still experimental

- tree runtime
- public event parity surface
- group / pivot runtime promotion
- benchmark timing interpretation

Do not lock app behavior to experimental features unless you accept churn.

## Minimum App-Side Validation

When another project wires in `VibeGrid`, validate at least:

1. render a basic grid
2. row selection
3. header menu
4. filter row
5. one edit flow
6. one paste flow
7. one save-bundle preview or equivalent save path

If the consumer app changes interaction or rendering behavior, run:

```powershell
npm run lint
npm run build
$env:CI='1'; npm run test:e2e
```

These commands belong in the `vibe-grid` repo when changing the shared product itself.

## Where To Change Things

### Change here when the behavior is shared product behavior

- `packages/core`
- `packages/react`
- `packages/clipboard`
- `packages/excel`
- `packages/persistence`
- `packages/i18n`
- `packages/theme-shadcn`

### Change in the consuming app when it is app-specific

- page layout
- API fetch wiring
- host-side save action
- host-side query construction
- app-specific toolbar around the grid

## Styling Rule

If a consumer app wants a different shell layout, change the app shell.

If the request changes:

- row height
- header appearance
- filter row appearance
- selection visuals
- sticky/pinned behavior
- editor visuals

that is a `vibe-grid` product change and must be made in the shared package.

For style work, also read:

- [C:\Users\kms\Desktop\dev\vibe-grid\docs\design\design-performance-guardrails.md](C:\Users\kms\Desktop\dev\vibe-grid\docs\design\design-performance-guardrails.md)
- [C:\Users\kms\Desktop\dev\vibe-grid\docs\development\style-change-bench-checklist.md](C:\Users\kms\Desktop\dev\vibe-grid\docs\development\style-change-bench-checklist.md)

## AI Guardrails

When an AI agent works on a project consuming `VibeGrid`, it should follow these rules:

1. Treat `@vibe-grid/react` as the main integration surface.
2. Do not copy code from `apps/playground` into the consuming app.
3. Do not bypass the product API with TanStack-specific app code.
4. If a shared behavior is missing, add it in `vibe-grid` first.
5. Check stable versus experimental boundaries before wiring new features.
6. Keep external app code focused on host data, not grid engine details.

## Suggested First Integration In `EHR_6`

The first safe integration step is:

1. render `VibeGrid` in one isolated screen
2. use `10~20` mock rows first
3. verify selection, filter, edit, paste
4. then wire server data
5. then wire save

Do not replace a production screen before the isolated screen works end to end.
