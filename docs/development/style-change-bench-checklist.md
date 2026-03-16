# Style Change Bench Checklist

Use this checklist every time a grid styling change is made.

This includes:

- token updates
- header or filter row redesign
- menu or editor surface redesign
- sticky or pinned visual changes
- row, badge, or selection visual changes

## 1. Required commands

Run:

```powershell
npm run lint
npm run build
$env:CI='1'; npm run test:e2e
```

Then manually inspect:

- `http://localhost:3203/labs/grid`
- `http://localhost:3203/labs/bench`

If you need production behavior, also verify with a production start flow.

## 2. Grid Lab manual checks

On `/labs/grid`, confirm:

- header text is readable and not vertically broken
- filter controls align correctly
- header menu opens and closes correctly
- pinned columns do not visually bleed
- selected row and range states remain readable
- active cell outline remains clear
- delete check, row state badge, and inline editors still look intentional

## 3. Bench checks

On `/labs/bench`, verify the actual `VibeGrid` path:

### Scenario switch

- 10k
- 50k
- 100k

Confirm:

- no lock-up on switch
- metric cards update
- rendered row count stays virtualized

### Selection and range

Confirm:

- single selection still responds immediately
- range selection does not lag visually
- pinned/sticky areas do not tear during selection

### Filter row

Confirm:

- typing in filter controls stays responsive
- apply/clear buttons do not cause visible layout jumps

### Header actions

Confirm:

- header menu opens without delay
- right-click menu still works
- pin left/right still feels stable
- width resize affordance remains usable

## 4. Visual hotspots to watch

Watch these specifically after design changes:

- sticky header paint behavior
- pinned boundary shadow
- translucent menu surfaces
- date editor popover blur
- large shadow stacks
- dense per-cell style changes

If any of these feel heavier than before, document it before push.

## 5. What to record in the PR or commit notes

For meaningful styling work, record:

- what changed visually
- whether `/labs/bench` changed in feel
- whether any interaction metric looked worse
- whether the change added blur/shadow/translucency

This does not need to be long.

It does need to be explicit.

## 6. Stop conditions

Do not push a styling change if:

- Playwright is red
- header resize or pinning became unreliable
- 100k scenario visibly stalls compared with the previous baseline
- sticky/pinned layers bleed or overlap incorrectly
- range selection or paste feels slower in a way you can notice immediately

When in doubt, revert the styling change or reduce the visual effect.

