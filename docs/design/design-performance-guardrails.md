# Design Performance Guardrails

This document defines the performance rules for visual refresh work in `VibeGrid`.

The goal is simple:

- allow visual evolution
- avoid accidental regressions in the real `VibeGrid` interaction path

This repository is not a static design showcase. It is a shared business-grid product.

## 1. What design changes are allowed by default

These changes are usually safe when applied carefully:

- color token updates
- border/radius updates
- spacing and padding changes
- font sizing and weight adjustments
- low-cost shadows on outer surfaces
- row striping
- badge/chip visual refinement

These changes still require bench verification, but they are not high-risk by default.

## 2. What design changes are high-risk

Treat these as performance-sensitive:

- `backdrop-filter`
- large translucent overlays
- heavy multi-layer shadows
- per-cell gradient or filter effects
- sticky and pinned layers with strong shadow stacks
- per-cell animated transitions
- increasing render-time style branching inside large row maps

If one of these is introduced, verify the real grid path before push.

## 3. Product rule: logic cost matters more than cosmetic cost

For `VibeGrid`, the main risk is not color changes.

The main risk is introducing visual logic that:

- causes more React work
- increases sticky/pinned compositing cost
- adds paint-heavy effects to many visible cells

Design work must not change:

- row virtualization behavior
- selection/range logic
- paste behavior
- persistence behavior
- filter/sort orchestration

unless that is explicitly part of the task.

## 4. Where expensive visual effects are allowed

Expensive effects are acceptable only on low-frequency surfaces such as:

- header menu popovers
- date editor popovers
- side panels
- isolated dialog surfaces

Avoid them on:

- every visible cell
- sticky header cells at large scale
- pinned columns that move during scroll
- range overlays rendered repeatedly per cell

## 5. Bench verification rule

Every meaningful grid styling change must be checked against the actual grid path on `/labs/bench`.

Do not rely on visual inspection alone.

Use:

- raw benchmark surface for a rough sanity check
- actual `VibeGrid` benchmark surface for product-path validation

## 6. Required comparison mindset

Do not ask whether the grid is “fast enough” in the abstract.

Ask:

- is it slower than before?
- does it change interaction feel?
- did sticky/pinned behavior become heavier?
- did filter or selection latency visibly worsen?

Prefer relative regression checks over arbitrary absolute numbers.

## 7. Practical regression thresholds

Use these as working guardrails.

- purely visual refresh:
  - if the median interaction number regresses by more than `10% to 15%`, investigate
- selection/range interaction:
  - should remain near immediate visual feedback
  - roughly one frame to low tens of milliseconds in normal local conditions
- menu/filter open:
  - should feel effectively instant
- 100k scenario switch:
  - compare against previous baseline instead of using a strict single number

These are not hard CI thresholds yet.

They are review thresholds.

## 8. Minimum review questions for visual changes

Before push, answer:

1. Did this change introduce blur, translucency, or a heavier shadow stack?
2. Did this change affect sticky/pinned layers?
3. Did this change add per-cell render complexity?
4. Did `/labs/bench` still feel the same under:
   - scenario switch
   - selection
   - filter apply
   - header menu open
   - pinning
5. Did Playwright pass on a fresh browser run?

If the answer to any of these is unclear, the work is not complete.

## 9. Recommended future policy

When performance numbers become stable enough, move from review guardrails to explicit latency bands in `P5`.

Until then:

- keep using the bench lab
- compare before and after
- treat style-only work as potentially performance-relevant

