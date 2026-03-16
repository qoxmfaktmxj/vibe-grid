import type {
  GridAfterPasteEvent,
  GridAfterRowCopyEvent,
  GridAfterSaveEvent,
  GridBeforePasteEvent,
  GridPublicEventHandlers,
} from "./contracts";

export function shouldApplyGridPaste<Row extends Record<string, unknown>, PasteSummary>(
  handlers: GridPublicEventHandlers<Row, PasteSummary> | undefined,
  event: GridBeforePasteEvent,
) {
  if (!handlers?.onBeforePaste) {
    return true;
  }

  return handlers.onBeforePaste(event) !== false;
}

export function emitGridAfterPaste<Row extends Record<string, unknown>, PasteSummary>(
  handlers: GridPublicEventHandlers<Row, PasteSummary> | undefined,
  event: GridAfterPasteEvent<PasteSummary>,
) {
  handlers?.onAfterPaste?.(event);
}

export function emitGridAfterSave<Row extends Record<string, unknown>, PasteSummary>(
  handlers: GridPublicEventHandlers<Row, PasteSummary> | undefined,
  event: GridAfterSaveEvent<Row>,
) {
  handlers?.onAfterSave?.(event);
}

export function emitGridAfterRowCopy<Row extends Record<string, unknown>, PasteSummary>(
  handlers: GridPublicEventHandlers<Row, PasteSummary> | undefined,
  event: GridAfterRowCopyEvent<Row>,
) {
  handlers?.onAfterRowCopy?.(event);
}
