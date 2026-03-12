# ADR 0001: VibeGrid Product Scope

## Status

Accepted

## Decision

We will build VibeGrid as a standalone internal grid product rather than a page-level table wrapper.

## Why

- IBSheet replacement requires product-level ownership of UX and state transitions.
- Multiple apps need the same business-grid behaviors.
- TanStack Table will be treated as an internal engine, not a public contract.

## Consequences

- Initial setup cost increases.
- Public API stability becomes a primary design goal.
- `EHR_6` remains a parity and UX comparison reference.
