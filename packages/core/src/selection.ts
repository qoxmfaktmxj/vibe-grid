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

type GridArrowDirection =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight";

type GridSelectionIndexMaps = {
  rowIndexByKey?: ReadonlyMap<string, number>;
  columnIndexByKey?: ReadonlyMap<string, number>;
};

function clampIndex(value: number, maxIndex: number) {
  return Math.min(Math.max(value, 0), maxIndex);
}

function getOffsetByDirection(direction: GridArrowDirection) {
  switch (direction) {
    case "ArrowUp":
      return { rowDelta: -1, columnDelta: 0 };
    case "ArrowDown":
      return { rowDelta: 1, columnDelta: 0 };
    case "ArrowLeft":
      return { rowDelta: 0, columnDelta: -1 };
    case "ArrowRight":
      return { rowDelta: 0, columnDelta: 1 };
    default:
      return { rowDelta: 0, columnDelta: 0 };
  }
}

function getIndexForKey(
  key: string,
  order: readonly string[],
  indexByKey?: ReadonlyMap<string, number>,
) {
  return indexByKey?.get(key) ?? order.indexOf(key);
}

function moveCellByDirection(
  cell: GridActiveCell,
  direction: GridArrowDirection,
  rowOrder: readonly string[],
  columnOrder: readonly string[],
  indexMaps?: GridSelectionIndexMaps,
) {
  const rowIndex = getIndexForKey(cell.rowKey, rowOrder, indexMaps?.rowIndexByKey);
  const columnIndex = getIndexForKey(
    cell.columnKey,
    columnOrder,
    indexMaps?.columnIndexByKey,
  );

  if (rowIndex === -1 || columnIndex === -1) {
    return undefined;
  }

  const { rowDelta, columnDelta } = getOffsetByDirection(direction);
  const nextRowIndex = clampIndex(rowIndex + rowDelta, rowOrder.length - 1);
  const nextColumnIndex = clampIndex(
    columnIndex + columnDelta,
    columnOrder.length - 1,
  );

  return {
    rowKey: rowOrder[nextRowIndex],
    columnKey: columnOrder[nextColumnIndex],
  } satisfies GridActiveCell;
}

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

export function setRowSelectionChecked(
  selection: GridSelectionState,
  rowKey: string,
  checked: boolean,
): GridSelectionState {
  const selectedRowIds = new Set(selection.selectedRowIds);

  if (checked) {
    selectedRowIds.add(rowKey);

    return {
      activeRowId: selection.activeRowId ?? rowKey,
      selectedRowIds,
      activeCell: selection.activeCell,
      range: undefined,
      mode: "row",
    };
  }

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

export function setManyRowSelectionChecked(
  selection: GridSelectionState,
  rowKeys: Iterable<string>,
  checked: boolean,
): GridSelectionState {
  const nextSelection = createSelectionState({
    activeRowId: selection.activeRowId,
    selectedRowIds: selection.selectedRowIds,
    activeCell: selection.activeCell,
    mode: "row",
  });

  const selectedRowIds = new Set(nextSelection.selectedRowIds);
  const targetRowKeys = [...rowKeys];

  if (checked) {
    for (const rowKey of targetRowKeys) {
      selectedRowIds.add(rowKey);
    }

    return {
      activeRowId: nextSelection.activeRowId ?? targetRowKeys[0],
      selectedRowIds,
      activeCell: nextSelection.activeCell,
      range: undefined,
      mode: "row",
    };
  }

  for (const rowKey of targetRowKeys) {
    selectedRowIds.delete(rowKey);
  }

  const activeRowId =
    nextSelection.activeRowId && selectedRowIds.has(nextSelection.activeRowId)
      ? nextSelection.activeRowId
      : [...selectedRowIds][0];

  return {
    activeRowId,
    selectedRowIds,
    activeCell:
      nextSelection.activeCell && selectedRowIds.has(nextSelection.activeCell.rowKey)
        ? nextSelection.activeCell
        : undefined,
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
  indexMaps?: GridSelectionIndexMaps,
): GridNormalizedRange | undefined {
  if (!selection.range) {
    return undefined;
  }

  const anchorRowIndex = getIndexForKey(
    selection.range.anchor.rowKey,
    rowOrder,
    indexMaps?.rowIndexByKey,
  );
  const focusRowIndex = getIndexForKey(
    selection.range.focus.rowKey,
    rowOrder,
    indexMaps?.rowIndexByKey,
  );
  const anchorColumnIndex = getIndexForKey(
    selection.range.anchor.columnKey,
    columnOrder,
    indexMaps?.columnIndexByKey,
  );
  const focusColumnIndex = getIndexForKey(
    selection.range.focus.columnKey,
    columnOrder,
    indexMaps?.columnIndexByKey,
  );

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
  indexMaps?: GridSelectionIndexMaps,
): GridActiveCell | undefined {
  if (selection.range && rowOrder && columnOrder) {
    const normalizedRange = getNormalizedCellRange(
      selection,
      rowOrder,
      columnOrder,
      indexMaps,
    );

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

export function moveActiveCellByArrow(
  selection: GridSelectionState,
  direction: GridArrowDirection,
  rowOrder: readonly string[],
  columnOrder: readonly string[],
  indexMaps?: GridSelectionIndexMaps,
): GridSelectionState | undefined {
  if (!selection.activeCell || rowOrder.length === 0 || columnOrder.length === 0) {
    return undefined;
  }

  const nextCell = moveCellByDirection(
    selection.activeCell,
    direction,
    rowOrder,
    columnOrder,
    indexMaps,
  );

  if (!nextCell) {
    return undefined;
  }

  return setActiveCell(clearRangeSelection(selection), nextCell);
}

export function extendRangeByArrow(
  selection: GridSelectionState,
  direction: GridArrowDirection,
  rowOrder: readonly string[],
  columnOrder: readonly string[],
  indexMaps?: GridSelectionIndexMaps,
): GridSelectionState | undefined {
  const originCell = selection.range?.focus ?? selection.activeCell;

  if (!originCell || rowOrder.length === 0 || columnOrder.length === 0) {
    return undefined;
  }

  const nextFocus = moveCellByDirection(
    originCell,
    direction,
    rowOrder,
    columnOrder,
    indexMaps,
  );

  if (!nextFocus) {
    return undefined;
  }

  const anchor = selection.range?.anchor ?? selection.activeCell ?? nextFocus;

  return updateRangeSelection(
    beginRangeSelection(
      createSelectionState({
        activeRowId: anchor.rowKey,
        activeCell: anchor,
      }),
      anchor,
    ),
    nextFocus,
  );
}
