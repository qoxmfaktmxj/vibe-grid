<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# scripts

## Purpose
Build and test automation scripts for the monorepo.

## Key Files

| File | Description |
|------|-------------|
| `run-core-tests.mjs` | Compiles TypeScript test files via `tsconfig.test.json`, creates shims, runs Node test runner on core and react unit tests |

## For AI Agents

### Working In This Directory
- `run-core-tests.mjs` compiles to `.omx/tmp/test-dist` before running
- Tests use Node's built-in test runner (no Jest/Vitest)
- Add new test targets here when creating unit tests for packages

<!-- MANUAL: -->
