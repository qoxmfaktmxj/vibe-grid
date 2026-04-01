<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# apps

## Purpose
Application surfaces that consume `packages/*` to demonstrate, validate, and benchmark VibeGrid behavior. These are Next.js apps used for internal testing and pilot evaluation.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `playground/` | Main validation surface: Grid Lab, Bench Lab, Employee Batch Lab, Compatibility Lab (see `playground/AGENTS.md`) |
| `bench/` | Isolated performance benchmark surface (see `bench/AGENTS.md`) |
| `compat-lab/` | Reserved placeholder (compatibility features are in playground) |
| `docs/` | Reserved placeholder for future documentation app |

## For AI Agents

### Working In This Directory
- Apps are validation surfaces, not the product itself
- Business logic belongs in `packages/*`, not here
- Lab-only behavior should not leak into shared packages
- Playground is the primary test target for Playwright E2E

### Testing Requirements
- `apps/playground` is the webserver for all E2E tests (port 5051 in CI)
- Changes to app routes may break Playwright selectors

<!-- MANUAL: -->
