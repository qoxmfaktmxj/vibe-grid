<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# .github

## Purpose
GitHub-specific configuration including CI/CD workflows.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `workflows/` | GitHub Actions CI pipeline |

## Key Files

| File | Description |
|------|-------------|
| `workflows/ci.yml` | CI pipeline: checkout → Node 22 setup → npm ci → Playwright install (Chromium) → lint → build → test:e2e → upload artifacts |

## For AI Agents

### Working In This Directory
- CI runs on Ubuntu with Node 22
- Only Chromium browser (no Firefox/WebKit yet)
- 1 retry enabled for flaky test resilience
- Playwright artifacts (test-results + HTML report) uploaded on failure
- `.only` is forbidden in CI mode

<!-- MANUAL: -->
