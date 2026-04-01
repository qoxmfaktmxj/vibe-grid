<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# packages

## Purpose
Shared library packages that form the VibeGrid product. Each package owns a specific domain of grid behavior and is consumed by apps or other packages. `@vibe-grid/core` is the foundational contract layer; `@vibe-grid/react` is the main consumer-facing component.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `core/` | Row state, selection, validation, save bundles, bulk orchestration, tree/group/pivot (see `core/AGENTS.md`) |
| `react/` | `VibeGrid` component, header/body/editor composition, interaction wiring (see `react/AGENTS.md`) |
| `clipboard/` | Rectangular paste parsing, overflow policy, paste validation (see `clipboard/AGENTS.md`) |
| `excel/` | XLSX import/export/template via exceljs (see `excel/AGENTS.md`) |
| `i18n/` | Grid message catalog for ko-KR and en-US (see `i18n/AGENTS.md`) |
| `persistence/` | Browser localStorage adapter for column state (see `persistence/AGENTS.md`) |
| `tanstack-adapter/` | VibeGridColumn to TanStack ColumnDef translation (see `tanstack-adapter/AGENTS.md`) |
| `testing/` | Benchmark workbench and performance lab (see `testing/AGENTS.md`) |
| `theme-shadcn/` | Design tokens and theme factory with auto color derivation (see `theme-shadcn/AGENTS.md`) |
| `virtualization/` | Row virtualization hook wrapping TanStack Virtual (see `virtualization/AGENTS.md`) |

## For AI Agents

### Dependency Graph
```
react ──┬─→ core
        ├─→ i18n
        ├─→ tanstack-adapter ──→ core
        ├─→ theme-shadcn
        └─→ virtualization

clipboard ──┬─→ core
            └─→ i18n

excel ──→ core
persistence ──→ core
testing ──→ core, clipboard, react
```

### Working In This Directory
- Shared contract changes belong in `core`
- Rendering and interaction changes belong in `react`
- Do not push app-specific shortcuts into shared packages
- TanStack is an internal detail; never expose TanStack types in public API

### Common Patterns
- Each package has `src/index.ts` as barrel export
- Each package has its own `package.json` and `tsconfig.json`
- No package has its own build step; consumed via workspace resolution

<!-- MANUAL: -->
