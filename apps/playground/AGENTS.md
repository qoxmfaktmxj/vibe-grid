<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/playground

## Purpose
Main validation and demonstration surface for VibeGrid. A Next.js 16 app hosting multiple test labs: Grid Lab (full CRUD), Performance Bench, Employee Batch Lab, and Compatibility Lab. This is the primary target for Playwright E2E tests.

## Key Files

| File | Description |
|------|-------------|
| `src/app/page.tsx` | Hub page with navigation to all 5 test screens |
| `src/app/layout.tsx` | Root layout |
| `src/app/AppNav.tsx` | Navigation component |
| `src/app/PlaygroundWorkbench.tsx` | Grid Lab main component (~1,933 lines) — full CRUD, selection, paste, editing, filter, sort, header menu |
| `src/app/excel-client.ts` | Lazy-loaded Excel import/export |
| `src/app/globals.css` | Global styles |
| `next.config.ts` | Next.js config with `typedRoutes`, `externalDir`, transpiled packages |
| `package.json` | Dependencies on 7 @vibe-grid packages |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/app/labs/` | Lab route pages (grid, bench, employee-batch, compatibility) |
| `src/app/api/` | API routes for server-side pagination/filtering |
| `src/features/` | Feature-specific models and components |

## For AI Agents

### Working In This Directory
- Dev server: `npm run dev` (port 5050), CI server: port 5051
- `PlaygroundWorkbench.tsx` is the largest file; read before modifying
- Route structure: `/` (hub), `/labs/grid`, `/labs/bench`, `/labs/employee-batch`, `/labs/compatibility`
- Data model uses `PlaygroundRow` with 8 columns (sampleCode, sampleName, department, jobTitle, useYn, sortOrder, note, effectiveDate)
- Lab-only behavior must not leak into shared packages

### Testing Requirements
- All Playwright E2E tests run against this app
- Changes to routes, selectors, or data-testid attributes may break E2E tests
- Verify with: `$env:CI='1'; npm run test:e2e`

### Common Patterns
- Korean UI text (HR/Employee domain)
- Lazy-loaded Excel via dynamic import
- Server-side pagination via API route

## Dependencies

### Internal
- `@vibe-grid/clipboard`, `@vibe-grid/core`, `@vibe-grid/excel`, `@vibe-grid/i18n`, `@vibe-grid/persistence`, `@vibe-grid/react`, `@vibe-grid/testing`

### External
- `next@16.1.6`, `react@19.2.3`

<!-- MANUAL: -->
