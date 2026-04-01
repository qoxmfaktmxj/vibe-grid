<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# e2e

## Purpose
Playwright E2E spec files testing real browser interactions against the Playground app.

## Key Files

| File | Description |
|------|-------------|
| `hub-smoke.spec.ts` | Smoke regression across all lab surfaces |
| `grid-lab.spec.ts` | Core grid workflows: selection, paste, editing, filter, sort, range, virtualization (~469 lines) |
| `grid-header-menu.spec.ts` | Header menu: open, filter state, pin/hide/sort/resize actions |
| `employee-batch.spec.ts` | Bulk orchestration, selection snapshots, mutation execution |
| `bench.spec.ts` | Performance path: 100K rows, density modes, pinning, combined features |
| `compatibility.spec.ts` | IBSheet feature parity verification |

## For AI Agents

### Working In This Directory
- Tests run against `http://127.0.0.1:5051` (Playground app)
- Use `data-testid` and `data-*` attributes for element selection
- Run: `$env:CI='1'; npm run test:e2e`
- Sequential execution (1 worker) to avoid state conflicts
- Screenshots/videos/traces captured on failure only

### Common Patterns
- `page.locator('[data-testid="..."]')` for element targeting
- `page.keyboard` for keyboard interaction testing
- `expect(locator).toBeVisible()` for assertion
- Tests verify real interaction behavior, not DOM snapshots

<!-- MANUAL: -->
