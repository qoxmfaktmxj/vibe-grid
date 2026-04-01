<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# docs

## Purpose
Product documentation covering architectural decisions, roadmap, design guidelines, development workflow, release discipline, and deployment. This is the source of truth for product direction and decisions.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `adr/` | Architecture Decision Records (product scope, TanStack internality) |
| `roadmap/` | Execution plan, slice status (1-9), phase status (P5-P7), feature backlog |
| `design/` | Visual design translation, performance guardrails, style checklist |
| `development/` | Development guide, AI consumption guide, style change checklist |
| `release/` | Public API stability boundaries, release routine |
| `deployment/` | Deployment configuration |
| `compatibility/` | IBSheet8 feature matrix and parity tracking |

## For AI Agents

### Working In This Directory
- Read docs BEFORE touching code (see root AGENTS.md read order)
- Update status docs when a slice or phase materially moves
- Update `CHANGELOG.md` when making meaningful stable changes
- Update `release/public-api-stability.md` when stable/experimental boundaries change
- `roadmap/current-execution-plan.md` is the master priority document

### Key Documents
| File | Purpose |
|------|---------|
| `roadmap/current-execution-plan.md` | Master execution priorities |
| `release/public-api-stability.md` | Stable vs experimental API boundary |
| `development/vibe-grid-development-guide.md` | Working agreement |
| `design/design-performance-guardrails.md` | Performance review rules for styling |

<!-- MANUAL: -->
