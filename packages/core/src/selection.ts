import type { GridActiveCell, GridSelectionState } from "./contracts";

export function createSelectionState(input?: {
  activeRowId?: string;
  selectedRowIds?: Iterable<string>;
  activeCell?: GridActiveCell;
}): GridSelectionState {
  const selectedRowIds = new Set(input?.selectedRowIds ?? []);

  if (input?.activeRowId) {
    selectedRowIds.add(input.activeRowId);
  }

  if (input?.activeCell) {
    selectedRowIds.add(input.activeCell.rowKey);
  }

  return {
    activeRowId: input?.activeCell?.rowKey ?? input?.activeRowId,
    selectedRowIds,
    activeCell: input?.activeCell,
  };
}

export function activateRow(
  selection: GridSelectionState,
  rowKey: string,
  options?: {
    preserveSelection?: boolean;
  },
): GridSelectionState {
  const selectedRowIds = options?.preserveSelection
    ? new Set(selection.selectedRowIds)
    : new Set<string>();

  selectedRowIds.add(rowKey);

  return {
    activeRowId: rowKey,
    selectedRowIds,
    activeCell:
      selection.activeCell?.rowKey === rowKey ? selection.activeCell : undefined,
  };
}

export function setActiveCell(
  selection: GridSelectionState,
  activeCell?: GridActiveCell,
  options?: {
    preserveSelection?: boolean;
  },
): GridSelectionState {
  if (!activeCell) {
    return {
      ...selection,
      activeCell: undefined,
    };
  }

  const selectedRowIds = options?.preserveSelection
    ? new Set(selection.selectedRowIds)
    : new Set<string>();

  selectedRowIds.add(activeCell.rowKey);

  return {
    activeRowId: activeCell.rowKey,
    selectedRowIds,
    activeCell,
  };
}

export function toggleRowSelection(
  selection: GridSelectionState,
  rowKey: string,
): GridSelectionState {
  const selectedRowIds = new Set(selection.selectedRowIds);

  if (selectedRowIds.has(rowKey)) {
    selectedRowIds.delete(rowKey);

    return {
      activeRowId:
        selection.activeRowId === rowKey
          ? [...selectedRowIds][0]
          : selection.activeRowId,
      selectedRowIds,
      activeCell:
        selection.activeCell?.rowKey === rowKey ? undefined : selection.activeCell,
    };
  }

  selectedRowIds.add(rowKey);

  return {
    activeRowId: rowKey,
    selectedRowIds,
    activeCell:
      selection.activeCell?.rowKey === rowKey ? selection.activeCell : undefined,
  };
}

export function clearSelection(): GridSelectionState {
  return {
    activeRowId: undefined,
    selectedRowIds: new Set<string>(),
    activeCell: undefined,
  };
}

export function pruneSelectionState(
  selection: GridSelectionState,
  rowIds: Iterable<string>,
): GridSelectionState {
  const validRowIds = new Set(rowIds);
  const selectedRowIds = new Set(
    [...selection.selectedRowIds].filter((rowId) => validRowIds.has(rowId)),
  );
  const activeRowId =
    selection.activeRowId && validRowIds.has(selection.activeRowId)
      ? selection.activeRowId
      : [...selectedRowIds][0];
  const activeCell =
    selection.activeCell && validRowIds.has(selection.activeCell.rowKey)
      ? selection.activeCell
      : undefined;

  if (activeRowId) {
    selectedRowIds.add(activeRowId);
  }

  return {
    activeRowId,
    selectedRowIds,
    activeCell,
  };
}

export function getPrimarySelectedRowId(selection: GridSelectionState) {
  return selection.activeRowId ?? [...selection.selectedRowIds][0];
}
