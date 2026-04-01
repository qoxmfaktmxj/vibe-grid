<!-- Parent: ../../../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# labs

## Purpose
Next.js route pages for individual test labs. Each subdirectory maps to a `/labs/*` route.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `grid/` | `/labs/grid` — Grid Lab (renders PlaygroundWorkbench) |
| `bench/` | `/labs/bench` — Performance Bench (renders BenchWorkbench) |
| `employee-batch/` | `/labs/employee-batch` — Employee Batch Lab (renders EmployeeBatchWorkbench) |
| `compatibility/` | `/labs/compatibility` — IBSheet8 Compatibility Matrix with tree/group/pivot demos |

## For AI Agents

### Working In This Directory
- Each subdirectory contains a `page.tsx` that is a thin route wrapper
- Actual component logic lives in `src/features/` or `src/app/`
- Adding a new lab requires: route page here + feature model in `src/features/` + hub link in `src/app/page.tsx`

<!-- MANUAL: -->
