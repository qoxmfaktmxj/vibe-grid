import type { MutableRefObject } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import {
  activateRow,
  beginEditSession,
  beginRangeSelection,
  clearRangeSelection,
  createSelectionState,
  isEditingCell,
  setActiveCell,
  toggleRowSelection,
  updateRangeSelection,
  type GridEditSession,
  type GridSelectionState,
} from "@vibe-grid/core";
import { vibeGridThemeTokens } from "@vibe-grid/theme-shadcn";
import { VibeGridInlineEditor } from "./VibeGridInlineEditor";
import type {
  GridActiveCellLike,
  InternalColumnMeta,
  RowRecord,
} from "./vibe-grid-types";
import {
  buildRangeShadow,
  getCellRangeState,
  getStickyCellStyle,
  type NormalizedCellRange,
} from "./vibe-grid-utils";

type VibeGridTableBodyProps<Row extends RowRecord> = {
  table: Table<Row>;
  rows: ReturnType<Table<Row>["getRowModel"]>["rows"];
  totalRowCount: number;
  rowMetaByKey: ReadonlyMap<string, { state: string }>;
  selectionState: GridSelectionState;
  editSession?: GridEditSession | null;
  onSelectionStateChange?: (state: GridSelectionState) => void;
  onEditSessionChange?: (session: GridEditSession | null) => void;
  onCellEditCommit?: (input: {
    rowKey: string;
    columnKey: string;
    draftValue: string;
  }) => void;
  emptyMessage: string;
  inputId: string;
  rowIndexByKey: Map<string, number>;
  columnIndexByKey: Map<string, number>;
  normalizedRange: NormalizedCellRange;
  focusGridSurface: () => void;
  dragRangeRef: MutableRefObject<{
    anchor: GridActiveCellLike;
    moved: boolean;
    lastFocus?: GridActiveCellLike;
  } | null>;
  suppressClickRef: MutableRefObject<boolean>;
  topSpacerHeight?: number;
  bottomSpacerHeight?: number;
  rowHeight?: number;
};

function buildShiftRangeState(
  selectionState: GridSelectionState,
  nextCell: GridActiveCellLike,
) {
  if (!selectionState.activeCell) {
    return undefined;
  }

  return updateRangeSelection(
    beginRangeSelection(
      createSelectionState({
        activeRowId: selectionState.activeCell.rowKey,
        activeCell: selectionState.activeCell,
      }),
      selectionState.activeCell,
    ),
    nextCell,
  );
}

export function VibeGridTableBody<Row extends RowRecord>({
  table,
  rows,
  totalRowCount,
  rowMetaByKey,
  selectionState,
  editSession,
  onSelectionStateChange,
  onEditSessionChange,
  onCellEditCommit,
  emptyMessage,
  inputId,
  rowIndexByKey,
  columnIndexByKey,
  normalizedRange,
  focusGridSurface,
  dragRangeRef,
  suppressClickRef,
  topSpacerHeight = 0,
  bottomSpacerHeight = 0,
  rowHeight,
}: VibeGridTableBodyProps<Row>) {
  if (totalRowCount === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={table.getVisibleLeafColumns().length}
            style={{
              padding: "40px 24px",
              textAlign: "center",
              color: vibeGridThemeTokens.body.emptyTextColor,
              background: vibeGridThemeTokens.body.emptyBackground,
            }}
          >
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {topSpacerHeight > 0 ? (
        <tr aria-hidden="true">
          <td
            colSpan={table.getVisibleLeafColumns().length}
            style={{
              height: topSpacerHeight,
              padding: 0,
              border: "none",
              background: "#fff",
            }}
          />
        </tr>
      ) : null}
      {rows.map((row) => {
        const isActive = row.id === selectionState.activeRowId;
        const isSelected = selectionState.selectedRowIds.has(row.id);
        const meta = rowMetaByKey.get(row.id);
        const rowBackground = isActive
          ? vibeGridThemeTokens.body.activeRowBackground
          : isSelected
            ? vibeGridThemeTokens.body.selectedRowBackground
            : vibeGridThemeTokens.body.rowBackground;

        return (
          <tr
            key={row.id}
            style={{
              background: rowBackground,
              cursor: "default",
              height: rowHeight,
            }}
          >
            {row.getVisibleCells().map((cell) => {
              const columnMeta = cell.column.columnDef.meta as
                | InternalColumnMeta<Row>
                | undefined;
              const isActiveCell =
                selectionState.activeCell?.rowKey === row.id &&
                selectionState.activeCell.columnKey === columnMeta?.columnKey;
              const editing =
                !!columnMeta?.columnKey &&
                isEditingCell(editSession, row.id, columnMeta.columnKey);
              const baseValue = cell.getValue();
              const rangeState = getCellRangeState({
                normalizedRange,
                rowKey: row.id,
                columnKey: columnMeta?.columnKey,
                rowIndexByKey,
                columnIndexByKey,
              });
              const rangeBackground = rangeState.inRange
                ? vibeGridThemeTokens.body.rangeBackground
                : undefined;

              return (
                <td
                  key={cell.id}
                  data-testid={
                    columnMeta?.columnKey
                      ? `grid-cell-${row.id}-${columnMeta.columnKey}`
                      : undefined
                  }
                  data-row-key={row.id}
                  data-column-key={columnMeta?.columnKey}
                  data-range-selected={rangeState.inRange ? "true" : "false"}
                  data-active-cell={isActiveCell ? "true" : "false"}
                  onMouseDown={(event) => {
                    focusGridSurface();

                    if (columnMeta?.internal || !columnMeta?.columnKey) {
                      return;
                    }

                    event.preventDefault();

                    if (event.shiftKey) {
                      const nextState = buildShiftRangeState(selectionState, {
                        rowKey: row.id,
                        columnKey: columnMeta.columnKey,
                      });

                      if (nextState) {
                        suppressClickRef.current = true;
                        onSelectionStateChange?.(nextState);
                      }

                      return;
                    }

                    dragRangeRef.current = {
                      anchor: {
                        rowKey: row.id,
                        columnKey: columnMeta.columnKey,
                      },
                      moved: false,
                      lastFocus: undefined,
                    };
                  }}
                  onClick={(event) => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }

                    focusGridSurface();

                    if (
                      event.shiftKey &&
                      !columnMeta?.internal &&
                      columnMeta?.columnKey
                    ) {
                      const nextState = buildShiftRangeState(selectionState, {
                        rowKey: row.id,
                        columnKey: columnMeta.columnKey,
                      });

                      if (nextState) {
                        onSelectionStateChange?.(nextState);
                      }

                      return;
                    }

                    const preserveSelection = event.ctrlKey || event.metaKey;
                    const nextBaseState = preserveSelection
                      ? toggleRowSelection(selectionState, row.id)
                      : activateRow(clearRangeSelection(selectionState), row.id);
                    const nextState =
                      columnMeta?.internal || !columnMeta?.columnKey
                        ? {
                            ...nextBaseState,
                            activeCell: undefined,
                            range: undefined,
                            mode: "row" as const,
                          }
                        : setActiveCell(
                            nextBaseState,
                            {
                              rowKey: row.id,
                              columnKey: columnMeta.columnKey,
                            },
                            {
                              preserveSelection,
                            },
                          );

                    onSelectionStateChange?.(nextState);
                  }}
                  onDoubleClick={() => {
                    if (
                      columnMeta?.internal ||
                      !columnMeta?.columnKey ||
                      columnMeta.editable === false
                    ) {
                      return;
                    }

                    onEditSessionChange?.(
                      beginEditSession({
                        rowKey: row.id,
                        columnKey: columnMeta.columnKey,
                        value: baseValue,
                      }),
                    );
                  }}
                  style={{
                    ...getStickyCellStyle(
                      cell.column,
                      isActiveCell
                        ? vibeGridThemeTokens.body.activeCellBackground
                        : (rangeBackground ?? rowBackground),
                      false,
                      isActive,
                    ),
                    borderBottom: `1px solid ${vibeGridThemeTokens.body.cellBorderColor}`,
                    padding: "14px 16px",
                    color:
                      meta?.state === "D"
                        ? vibeGridThemeTokens.body.deletedCellTextColor
                        : vibeGridThemeTokens.body.cellTextColor,
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    verticalAlign: "middle",
                    boxShadow: [
                      buildRangeShadow(rangeState),
                      isActiveCell
                        ? `inset 0 0 0 2px ${vibeGridThemeTokens.body.activeCellOutline}`
                        : undefined,
                    ]
                      .filter(Boolean)
                      .join(", "),
                  }}
                >
                  {editing ? (
                    <label htmlFor={`${inputId}-${row.id}-${columnMeta?.columnKey}`}>
                      <span style={{ display: "none" }}>{columnMeta?.columnKey}</span>
                      <VibeGridInlineEditor
                        inputId={inputId}
                        rowId={row.id}
                        columnKey={columnMeta?.columnKey}
                        editor={columnMeta?.editor}
                        row={row.original}
                        editSession={editSession}
                        onEditSessionChange={onEditSessionChange}
                        onCellEditCommit={onCellEditCommit}
                      />
                    </label>
                  ) : (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
                </td>
              );
            })}
          </tr>
        );
      })}
      {bottomSpacerHeight > 0 ? (
        <tr aria-hidden="true">
          <td
            colSpan={table.getVisibleLeafColumns().length}
            style={{
              height: bottomSpacerHeight,
              padding: 0,
              border: "none",
              background: vibeGridThemeTokens.body.spacerBackground,
            }}
          />
        </tr>
      ) : null}
    </tbody>
  );
}
