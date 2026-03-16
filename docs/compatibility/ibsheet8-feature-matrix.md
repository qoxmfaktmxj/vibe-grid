# IBSheet8 Compatibility Matrix

## Source Documents

The current comparison baseline is the IBSheet8 manual under:

- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\appx\basic-course.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\appx\header.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\appx\init-structure.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\events\on-before-paste.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\events\on-after-paste.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\events\on-after-save.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\events\on-after-row-copy.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\userGuide\group.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\userGuide\pivot.html`

## Current Status

### Done

- row-first selection + range selection + range copy/paste
- save bundle and row state split
- header menu
  - sort
  - hide
  - left/right pin
  - reset width
- in-grid filter row
- delete-check column
- HeaderCheck-style rowCheck column with header all-check
- xlsx import / export / template
- actual render-path row virtualization with bench verification
- Playwright browser verification on Grid Lab, Bench, Compatibility, and Hub

### Partial

- date editor
  - foundation implemented
  - host holiday/date-policy helpers implemented
  - disabled-reason UX still needs polish
- public event parity
  - `onBeforePaste` supported through the shared `VibeGrid` paste surface
  - `onAfterPaste`, `onAfterSave`, `onAfterRowCopy` exposed as experimental shared host events
  - payload naming and stable/experimental boundary still need to be finalized
- Group / Tree / Pivot
  - experimental preview helpers exist in `@vibe-grid/core`
  - Compatibility Lab now renders preview sections for all three
  - they are not yet promoted into the main `VibeGrid` runtime

## Current Interpretation

VibeGrid is now past the “basic pilot” threshold and covers the most important IBSheet replacement workflows for:

- CRUD-style business screens
- selection / paste / save
- header control
- filter-row operation
- large-row rendering via virtualization

It is still not a full IBSheet API clone. The product direction remains:

- replace IBSheet operating UX where it matters
- avoid copying every legacy API surface mechanically
- promote only the event and view contracts that prove valuable in pilots

## Remaining Gaps

- stable naming for shared public event payloads
- decision on which event hooks become stable versus remain experimental
- promotion decision for Group / Tree / Pivot from compatibility preview into runtime
- stronger date editor UX for disabled reasons and host examples

## Practical Conclusion

Current VibeGrid status is:

- good enough for internal pilot migration work
- not yet a full “replace every IBSheet screen blindly” standard

That is the correct position for the repo right now.
