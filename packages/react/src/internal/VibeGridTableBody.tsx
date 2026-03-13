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
  } | null>;
  suppressClickRef: MutableRefObject<boolean>;
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

function buildDragRangeState(anchor: GridActiveCellLike, nextCell: GridActiveCellLike) {
  return updateRangeSelection(
    beginRangeSelection(
      createSelectionState({
        activeRowId: anchor.rowKey,
        activeCell: anchor,
      }),
      anchor,
    ),
    nextCell,
  );
}

export function VibeGridTableBody<Row extends RowRecord>({
  table,
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
}: VibeGridTableBodyProps<Row>) {
  if (table.getRowModel().rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={table.getVisibleLeafColumns().length}
            style={{
              padding: "40px 24px",
              textAlign: "center",
              color: "#64748b",
              background: "#fff",
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
      {table.getRowModel().rows.map((row) => {
        const isActive = row.id === selectionState.activeRowId;
        const isSelected = selectionState.selectedRowIds.has(row.id);
        const meta = rowMetaByKey.get(row.id);
        const rowBackground = isActive
          ? "rgba(14,165,233,0.12)"
          : isSelected
            ? "rgba(14,165,233,0.06)"
            : "#fff";

        return (
          <tr key={row.id} style={{ background: rowBackground, cursor: "default" }}>
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
                ? "rgba(20,184,166,0.12)"
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
                    };
                  }}
                  onMouseEnter={(event) => {
                    const dragState = dragRangeRef.current;

                    if (
                      !dragState ||
                      event.buttons !== 1 ||
                      columnMeta?.internal ||
                      !columnMeta?.columnKey
                    ) {
                      return;
                    }

                    if (
                      dragState.anchor.rowKey === row.id &&
                      dragState.anchor.columnKey === columnMeta.columnKey
                    ) {
                      return;
                    }

                    dragState.moved = true;
                    onSelectionStateChange?.(
                      buildDragRangeState(dragState.anchor, {
                        rowKey: row.id,
                        columnKey: columnMeta.columnKey,
                      }),
                    );
                  }}
                  onMouseMove={() => {
                    const dragState = dragRangeRef.current;

                    if (
                      !dragState ||
                      columnMeta?.internal ||
                      !columnMeta?.columnKey
                    ) {
                      return;
                    }

                    if (
                      dragState.anchor.rowKey === row.id &&
                      dragState.anchor.columnKey === columnMeta.columnKey
                    ) {
                      return;
                    }

                    dragState.moved = true;
                    onSelectionStateChange?.(
                      buildDragRangeState(dragState.anchor, {
                        rowKey: row.id,
                        columnKey: columnMeta.columnKey,
                      }),
                    );
                  }}
                  onMouseUp={() => {
                    const dragState = dragRangeRef.current;

                    if (
                      !dragState ||
                      columnMeta?.internal ||
                      !columnMeta?.columnKey
                    ) {
                      return;
                    }

                    if (
                      dragState.anchor.rowKey === row.id &&
                      dragState.anchor.columnKey === columnMeta.columnKey
                    ) {
                      return;
                    }

                    dragState.moved = true;
                    onSelectionStateChange?.(
                      buildDragRangeState(dragState.anchor, {
                        rowKey: row.id,
                        columnKey: columnMeta.columnKey,
                      }),
                    );
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
                      isActiveCell ? "#e0f2fe" : (rangeBackground ?? rowBackground),
                      false,
                      isActive,
                    ),
                    borderBottom: "1px solid #eef2f7",
                    padding: "14px 16px",
                    color: meta?.state === "D" ? "#94a3b8" : "#0f172a",
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    verticalAlign: "middle",
                    boxShadow: [
                      buildRangeShadow(rangeState),
                      isActiveCell ? "inset 0 0 0 2px #0ea5e9" : undefined,
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
    </tbody>
  );
}
