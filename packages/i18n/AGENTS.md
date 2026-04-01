<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# @vibe-grid/i18n

## Purpose
Internationalization catalog with 46 message keys covering all grid UI text. Supports Korean (ko-KR, default) and English (en-US) with template variable substitution.

## Key Files

| File | Description |
|------|-------------|
| `src/index.ts` | All exports: gridMessageKeys, getGridMessage, getGridMessages, formatGridMessage, GridLocale, GridMessageKey |

## For AI Agents

### Working In This Directory
- Default locale is `ko-KR`
- Template syntax: `{variableName}` for substitution
- Message categories: commands, header menu, status messages, validation
- Add both ko-KR and en-US translations when adding new messages

### Common Patterns
- Message keys are string constants (not enums)
- `formatGridMessage()` handles variable replacement

## Dependencies

### Internal
None

### External
None

<!-- MANUAL: -->
