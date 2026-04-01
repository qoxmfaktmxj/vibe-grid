<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/testing

## Purpose
Performance benchmarking and test harness components. Provides `BenchWorkbench` for simple benchmarks and `RealGridPerformanceLab` for advanced interaction-level performance testing with multiple scenarios (10K, 50K, 100K rows).

## Key Files

| File | Description |
|------|-------------|
| `src/index.ts` | Barrel export for both components |
| `src/BenchWorkbench.tsx` | Simple benchmark component |
| `src/RealGridPerformanceLab.tsx` | Advanced performance lab (~27KB) with scenario selection, density testing, interaction metrics, paste simulation |

## For AI Agents

### Working In This Directory
- Used by both `apps/playground` and `apps/bench`
- Performance lab measures: selection, filters, sorting, columns, paste operations
- Bench verification is mandatory for styling changes (see `docs/design/design-performance-guardrails.md`)

## Dependencies

### Internal
- `@vibe-grid/core` — types and benchmark utilities
- `@vibe-grid/clipboard` — paste plan building
- `@vibe-grid/react` — VibeGrid component

### External
- `react`

<!-- MANUAL: -->
