<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# tests

## Purpose
Playwright E2E browser regression tests covering real user interactions (click, keyboard, paste, drag, filter, sort, pin) against the Playground app.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `e2e/` | All Playwright spec files (see `e2e/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Playwright tests verify real browser behavior, not snapshots
- Tests run against `apps/playground` on port 5051
- Use `data-testid` and `data-*` attributes for element targeting
- Run: `$env:CI='1'; npm run test:e2e`

### Testing Requirements
- Any interaction or UI change must have corresponding Playwright coverage
- Tests run sequentially (1 worker) to avoid state conflicts
- Screenshots, videos, traces are captured on failure

<!-- MANUAL: -->
