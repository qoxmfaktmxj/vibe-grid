import type {
  GridActiveCell,
  GridCellRangeSelection,
  GridSelectionState,
} from "./contracts";

type GridNormalizedRange = {
  anchor: GridActiveCell;
  focus: GridActiveCell;
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
};

export function createSelectionState(input?: {
  activeRowId?: string;
  selectedRowIds?: Iterable<string>;
  activeCell?: GridActiveCell;
  range?: GridCellRangeSelection;
  mode?: GridSelectionState["mode"];
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
    range: input?.range,
    mode: input?.range ? "range" : (input?.mode ?? "row"),
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
    range: undefined,
    mode: "row",
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
      range: undefined,
      mode: "row",
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
    range: undefined,
    mode: "row",
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
      range: undefined,
      mode: "row",
    };
  }

  selectedRowIds.add(rowKey);

  return {
    activeRowId: rowKey,
    selectedRowIds,
    activeCell:
      selection.activeCell?.rowKey === rowKey ? selection.activeCell : undefined,
    range: undefined,
    mode: "row",
  };
}

export function clearSelection(): GridSelectionState {
  return {
    activeRowId: undefined,
    selectedRowIds: new Set<string>(),
    activeCell: undefined,
    range: undefined,
    mode: "row",
  };
}

export function beginRangeSelection(
  selection: GridSelectionState,
  anchor: GridActiveCell,
): GridSelectionState {
  return {
    activeRowId: anchor.rowKey,
    selectedRowIds: new Set([anchor.rowKey]),
    activeCell: anchor,
    range: {
      anchor,
      focus: anchor,
    },
    mode: "range",
  };
}

export function updateRangeSelection(
  selection: GridSelectionState,
  focus: GridActiveCell,
): GridSelectionState {
  const anchor = selection.range?.anchor ?? selection.activeCell ?? focus;

  return {
    activeRowId: focus.rowKey,
    selectedRowIds: new Set([focus.rowKey]),
    activeCell: focus,
    range: {
      anchor,
      focus,
    },
    mode: "range",
  };
}

export function clearRangeSelection(
  selection: GridSelectionState,
): GridSelectionState {
  return {
    ...selection,
    range: undefined,
    mode: "row",
  };
}

export function hasRangeSelection(selection: GridSelectionState) {
  return !!selection.range;
}

export function getNormalizedCellRange(
  selection: GridSelectionState,
  rowOrder: readonly string[],
  columnOrder: readonly string[],
): GridNormalizedRange | undefined {
  if (!selection.range) {
    return undefined;
  }

  const anchorRowIndex = rowOrder.indexOf(selection.range.anchor.rowKey);
  const focusRowIndex = rowOrder.indexOf(selection.range.focus.rowKey);
  const anchorColumnIndex = columnOrder.indexOf(selection.range.anchor.columnKey);
  const focusColumnIndex = columnOrder.indexOf(selection.range.focus.columnKey);

  if (
    anchorRowIndex === -1 ||
    focusRowIndex === -1 ||
    anchorColumnIndex === -1 ||
    focusColumnIndex === -1
  ) {
    return undefined;
  }

  return {
    anchor: selection.range.anchor,
    focus: selection.range.focus,
    startRowIndex: Math.min(anchorRowIndex, focusRowIndex),
    endRowIndex: Math.max(anchorRowIndex, focusRowIndex),
    startColumnIndex: Math.min(anchorColumnIndex, focusColumnIndex),
    endColumnIndex: Math.max(anchorColumnIndex, focusColumnIndex),
  };
}

export function getSelectionAnchorCell(
  selection: GridSelectionState,
  rowOrder?: readonly string[],
  columnOrder?: readonly string[],
): GridActiveCell | undefined {
  if (selection.range && rowOrder && columnOrder) {
    const normalizedRange = getNormalizedCellRange(selection, rowOrder, columnOrder);

    if (normalizedRange) {
      return {
        rowKey: rowOrder[normalizedRange.startRowIndex],
        columnKey: columnOrder[normalizedRange.startColumnIndex],
      };
    }
  }

  return selection.activeCell;
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
  const range =
    selection.range &&
    validRowIds.has(selection.range.anchor.rowKey) &&
    validRowIds.has(selection.range.focus.rowKey)
      ? selection.range
      : undefined;

  if (activeRowId) {
    selectedRowIds.add(activeRowId);
  }

  return {
    activeRowId,
    selectedRowIds,
    activeCell,
    range,
    mode: range ? "range" : "row",
  };
}

export function getPrimarySelectedRowId(selection: GridSelectionState) {
  return selection.activeRowId ?? [...selection.selectedRowIds][0];
}
