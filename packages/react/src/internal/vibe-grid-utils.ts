import type { Column, Updater } from "@tanstack/react-table";
import { vibeGridThemeTokens } from "@vibe-grid/theme-shadcn";
import type { RowRecord } from "./vibe-grid-types";

export type NormalizedCellRange =
  | {
      startRowIndex: number;
      endRowIndex: number;
      startColumnIndex: number;
      endColumnIndex: number;
    }
  | null
  | undefined;

export type GridRangeCellState = {
  inRange: boolean;
  isTop: boolean;
  isRight: boolean;
  isBottom: boolean;
  isLeft: boolean;
};

const EMPTY_RANGE_CELL_STATE: GridRangeCellState = {
  inRange: false,
  isTop: false,
  isRight: false,
  isBottom: false,
  isLeft: false,
};

export function resolveUpdater<Value>(updater: Updater<Value>, current: Value): Value {
  return typeof updater === "function"
    ? (updater as (previous: Value) => Value)(current)
    : updater;
}

export function getCellRangeState(input: {
  normalizedRange: NormalizedCellRange;
  rowKey: string;
  columnKey?: string;
  rowIndexByKey: Map<string, number>;
  columnIndexByKey: Map<string, number>;
}): GridRangeCellState {
  if (!input.normalizedRange || !input.columnKey) {
    return EMPTY_RANGE_CELL_STATE;
  }

  const rowIndex = input.rowIndexByKey.get(input.rowKey);
  const columnIndex = input.columnIndexByKey.get(input.columnKey);

  if (rowIndex == null || columnIndex == null) {
    return EMPTY_RANGE_CELL_STATE;
  }

  const inRange =
    rowIndex >= input.normalizedRange.startRowIndex &&
    rowIndex <= input.normalizedRange.endRowIndex &&
    columnIndex >= input.normalizedRange.startColumnIndex &&
    columnIndex <= input.normalizedRange.endColumnIndex;

  return {
    inRange,
    isTop: inRange && rowIndex === input.normalizedRange.startRowIndex,
    isRight: inRange && columnIndex === input.normalizedRange.endColumnIndex,
    isBottom: inRange && rowIndex === input.normalizedRange.endRowIndex,
    isLeft: inRange && columnIndex === input.normalizedRange.startColumnIndex,
  };
}

export function buildRangeShadow(rangeState: GridRangeCellState) {
  if (!rangeState.inRange) {
    return undefined;
  }

  return [
    rangeState.isTop
      ? `inset 0 2px 0 0 ${vibeGridThemeTokens.sticky.rangeOutline}`
      : undefined,
    rangeState.isRight
      ? `inset -2px 0 0 0 ${vibeGridThemeTokens.sticky.rangeOutline}`
      : undefined,
    rangeState.isBottom
      ? `inset 0 -2px 0 0 ${vibeGridThemeTokens.sticky.rangeOutline}`
      : undefined,
    rangeState.isLeft
      ? `inset 2px 0 0 0 ${vibeGridThemeTokens.sticky.rangeOutline}`
      : undefined,
  ]
    .filter(Boolean)
    .join(", ");
}

export function getStickyCellStyle<Row extends RowRecord>(
  column: Column<Row, unknown>,
  background: string,
  isHeader: boolean,
  isActiveRow = false,
) {
  const pinned = column.getIsPinned();
  const isLeft = pinned === "left";
  const isRight = pinned === "right";

  return {
    position: pinned ? ("sticky" as const) : ("relative" as const),
    left: isLeft ? column.getStart("left") : undefined,
    right: isRight ? column.getAfter("right") : undefined,
    zIndex: isHeader ? (pinned ? 6 : 4) : pinned ? (isActiveRow ? 3 : 2) : 1,
    background,
    boxShadow: isLeft && column.getIsLastColumn("left")
      ? `2px 0 0 0 ${vibeGridThemeTokens.sticky.boundaryColor}, 10px 0 14px -14px ${vibeGridThemeTokens.sticky.boundaryShadow}`
      : isRight && column.getIsFirstColumn("right")
        ? `-2px 0 0 0 ${vibeGridThemeTokens.sticky.boundaryColor}, -10px 0 14px -14px ${vibeGridThemeTokens.sticky.boundaryShadow}`
        : undefined,
  };
}
