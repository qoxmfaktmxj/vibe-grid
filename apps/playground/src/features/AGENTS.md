<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# features

## Purpose
Feature-specific data models, schemas, and components used by the Playground labs. Contains column definitions, row types, validation rules, and mock data generators.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `grid-lab/` | Grid Lab data model (PlaygroundRow schema, 8 columns, validation, mock data) |
| `employee-batch/` | Employee Batch model (15K employee dataset, bulk orchestration schema) |

## For AI Agents

### Working In This Directory
- Models define column schemas consumed by VibeGrid
- These are app-specific; do not move into shared packages
- `grid-lab/model.ts` is the primary schema (~12K lines) for Grid Lab
- `employee-batch/model.ts` defines the employee batch dataset and orchestration config

<!-- MANUAL: -->
