<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/bench

## Purpose
Dedicated performance benchmarking surface. A minimal Next.js app that renders `BenchWorkbench` from `@vibe-grid/testing` for isolated large-dataset performance regression testing.

## Key Files

| File | Description |
|------|-------------|
| `src/app/page.tsx` | Single page rendering BenchWorkbench |
| `src/app/layout.tsx` | Root layout |
| `src/app/globals.css` | Global styles |
| `next.config.ts` | Minimal config with only `@vibe-grid/core` transpiled |
| `package.json` | Depends on core + testing |

## For AI Agents

### Working In This Directory
- This is a thin wrapper; actual benchmark logic is in `@vibe-grid/testing`
- Dev server: `npm run dev` (port 3000)
- Used for isolated performance testing when playground is too heavy

### Testing Requirements
- `tests/e2e/bench.spec.ts` covers performance path validation
- Bench verification is mandatory for styling changes

## Dependencies

### Internal
- `@vibe-grid/core`, `@vibe-grid/testing`

### External
- `next@16.1.6`, `react@19.2.3`

<!-- MANUAL: -->
