import type { GridEditSession } from "./contracts";

export function beginEditSession(input: {
  rowKey: string;
  columnKey: string;
  value: unknown;
}): GridEditSession {
  return {
    rowKey: input.rowKey,
    columnKey: input.columnKey,
    draftValue: input.value == null ? "" : String(input.value),
    startedAt: Date.now(),
  };
}

export function updateEditSessionDraft(
  session: GridEditSession,
  draftValue: string,
): GridEditSession {
  return {
    ...session,
    draftValue,
  };
}

export function clearEditSession() {
  return null;
}

export function isEditingCell(
  session: GridEditSession | null | undefined,
  rowKey: string,
  columnKey: string,
) {
  return session?.rowKey === rowKey && session.columnKey === columnKey;
}
