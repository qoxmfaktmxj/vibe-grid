import type { MutableRefObject } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import {
  activateRow,
  beginEditSession,
  beginRangeSelection,
  clearRangeSelection,
  createSelectionState,
  isGridCellEditable,
  isEditingCell,
  setActiveCell,
  toggleRowSelection,
  updateRangeSelection,
  type GridEditActivation,
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
  editActivation: GridEditActivation;
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
    pendingFocus?: GridActiveCellLike;
  } | null>;
  shiftRangeAnchorRef: MutableRefObject<GridActiveCellLike | null>;
  suppressClickRef: MutableRefObject<boolean>;
  topSpacerHeight?: number;
  bottomSpacerHeight?: number;
  rowHeight?: number;
};

function buildShiftRangeState(
  anchor: GridActiveCellLike,
  nextCell: GridActiveCellLike,
) {
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
  rows,
  totalRowCount,
  rowMetaByKey,
  selectionState,
  editSession,
  onSelectionStateChange,
  onEditSessionChange,
  onCellEditCommit,
  editActivation,
  emptyMessage,
  inputId,
  rowIndexByKey,
  columnIndexByKey,
  normalizedRange,
  focusGridSurface,
  dragRangeRef,
  shiftRangeAnchorRef,
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
              background: vibeGridThemeTokens.body.spacerBackground,
            }}
          />
        </tr>
      ) : null}
      {rows.map((row) => {
        const baseRowBackground =
          row.index % 2 === 0
            ? vibeGridThemeTokens.body.rowOddBackground
            : vibeGridThemeTokens.body.rowEvenBackground;
        const isActive = row.id === selectionState.activeRowId;
        const isSelected = selectionState.selectedRowIds.has(row.id);
        const meta = rowMetaByKey.get(row.id);
        const rowBackground = isActive
          ? vibeGridThemeTokens.body.activeRowBackground
          : isSelected
            ? vibeGridThemeTokens.body.selectedRowBackground
            : baseRowBackground;

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
              const isEditableCell =
                !columnMeta?.internal &&
                !!columnMeta?.columnKey &&
                isGridCellEditable(columnMeta.editable, row.original);
              const isRowCheckCell = columnMeta?.internalControl === "rowCheck";
              const isDeleteCheckCell = columnMeta?.internalControl === "deleteCheck";
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
              const openEditSession = () => {
                if (
                  columnMeta?.internal ||
                  !columnMeta?.columnKey ||
                  !isEditableCell
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
              };

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
                  data-cell-editable={isEditableCell ? "true" : "false"}
                  onMouseDown={(event) => {
                    focusGridSurface();

                    if (columnMeta?.internal || !columnMeta?.columnKey) {
                      return;
                    }

                    event.preventDefault();

                    if (event.shiftKey) {
                      const anchor =
                        shiftRangeAnchorRef.current ??
                        selectionState.range?.anchor ??
                        selectionState.activeCell ??
                        {
                          rowKey: row.id,
                          columnKey: columnMeta.columnKey,
                        };
                      shiftRangeAnchorRef.current = anchor;
                      const nextState = buildShiftRangeState(anchor, {
                        rowKey: row.id,
                        columnKey: columnMeta.columnKey,
                      });

                      if (nextState) {
                        suppressClickRef.current = true;
                        onSelectionStateChange?.(nextState);
                      }

                      return;
                    }

                    shiftRangeAnchorRef.current = null;
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

                    if (isRowCheckCell || isDeleteCheckCell) {
                      return;
                    }

                    if (
                      event.shiftKey &&
                      !columnMeta?.internal &&
                      columnMeta?.columnKey
                    ) {
                      const anchor =
                        shiftRangeAnchorRef.current ??
                        selectionState.range?.anchor ??
                        selectionState.activeCell ??
                        {
                          rowKey: row.id,
                          columnKey: columnMeta.columnKey,
                        };
                      shiftRangeAnchorRef.current = anchor;
                      const nextState = buildShiftRangeState(anchor, {
                        rowKey: row.id,
                        columnKey: columnMeta.columnKey,
                      });

                      if (nextState) {
                        onSelectionStateChange?.(nextState);
                      }

                      return;
                    }

                    const preserveSelection = event.ctrlKey || event.metaKey;
                    shiftRangeAnchorRef.current = null;
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

                    if (
                      editActivation === "singleClick" &&
                      !preserveSelection &&
                      !event.shiftKey &&
                      !rangeState.inRange
                    ) {
                      openEditSession();
                    }
                  }}
                  onDoubleClick={() => {
                    if (isRowCheckCell || isDeleteCheckCell) {
                      return;
                    }
                    openEditSession();
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
                    padding: "12px 18px",
                    color:
                      meta?.state === "D"
                        ? vibeGridThemeTokens.body.deletedCellTextColor
                        : vibeGridThemeTokens.body.cellTextColor,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 600,
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
                    <div style={{ display: "grid" }}>
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
                    </div>
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
