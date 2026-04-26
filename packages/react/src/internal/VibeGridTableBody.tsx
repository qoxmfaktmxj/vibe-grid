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
import type { VibeGridThemeTokens } from "@vibe-grid/theme-shadcn";
import { VibeGridInlineEditor } from "./VibeGridInlineEditor";
import type {
  GridActiveCellLike,
  GridDensityMetricsLike,
  InternalColumnMeta,
  RowRecord,
  TreeRuntimeRowLike,
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
  densityMetrics: GridDensityMetricsLike;
  firstBusinessColumnKey?: string;
  treeRowMetaByKey?: ReadonlyMap<string, TreeRuntimeRowLike>;
  onTreeToggle?: (rowKey: string) => void;
  theme: VibeGridThemeTokens;
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
  densityMetrics,
  firstBusinessColumnKey,
  treeRowMetaByKey,
  onTreeToggle,
  theme,
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
              color: theme.body.emptyTextColor,
              background: theme.body.emptyBackground,
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
              background: theme.body.spacerBackground,
            }}
          />
        </tr>
      ) : null}
      {rows.map((row) => {
        const baseRowBackground =
          row.index % 2 === 0
            ? theme.body.rowOddBackground
            : theme.body.rowEvenBackground;
        const isActive = row.id === selectionState.activeRowId;
        const isSelected = selectionState.selectedRowIds.has(row.id);
        const meta = rowMetaByKey.get(row.id);
        const rowBackground = isActive
          ? theme.body.activeRowBackground
          : isSelected
            ? theme.body.selectedRowBackground
            : baseRowBackground;

        return (
          <tr
            key={row.id}
            className="vg-row"
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
              const treeRowMeta = treeRowMetaByKey?.get(row.id);
              const isTreeLeadCell =
                !!treeRowMeta && columnMeta?.columnKey === firstBusinessColumnKey;
              const rangeState = getCellRangeState({
                normalizedRange,
                rowKey: row.id,
                columnKey: columnMeta?.columnKey,
                rowIndexByKey,
                columnIndexByKey,
              });
              const rangeBackground = rangeState.inRange
                ? theme.body.rangeBackground
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
                        ? theme.body.activeCellBackground
                        : (rangeBackground ?? rowBackground),
                      false,
                      isActive,
                      theme,
                    ),
                    borderBottom: `1px solid ${theme.body.cellBorderColor}`,
                    padding: `${densityMetrics.cellPaddingBlock}px ${densityMetrics.cellPaddingInline}px`,
                    color:
                      meta?.state === "D"
                        ? theme.body.deletedCellTextColor
                        : editing
                          ? theme.body.editingTextColor
                          : isActiveCell
                            ? theme.body.activeTextColor
                            : theme.body.cellTextColor,
                    fontSize: 13,
                    fontWeight: isActiveCell ? 500 : 400,
                    verticalAlign: "middle",
                    zIndex: editing ? 50 : undefined,
                    overflow: editing ? "visible" : undefined,
                    boxShadow: [
                      buildRangeShadow(rangeState, theme),
                      isActiveCell && !editing
                        ? `inset 0 0 0 2px ${theme.body.activeCellOutline}`
                        : undefined,
                    ]
                      .filter(Boolean)
                      .join(", ") || "none",
                  }}
                >
                  {editing ? (
                    <div style={{ display: "flex", alignItems: "center", minHeight: 0 }}>
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
                        theme={theme}
                      />
                    </div>
                  ) : (
                    isTreeLeadCell ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          paddingLeft: `${treeRowMeta.level * 18}px`,
                          minWidth: 0,
                        }}
                      >
                        {treeRowMeta.hasChildren ? (
                          <button
                            type="button"
                            data-testid={`tree-toggle-${row.id}`}
                            data-tree-expanded={treeRowMeta.isExpanded ? "true" : "false"}
                            aria-label={`${row.id} tree toggle`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onTreeToggle?.(row.id);
                              focusGridSurface();
                            }}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 999,
                              border: `1px solid ${theme.body.cellBorderColor}`,
                              background: theme.surface.background,
                              color: theme.body.cellTextColor,
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            {treeRowMeta.isExpanded ? "-" : "+"}
                          </button>
                        ) : (
                          <span
                            aria-hidden="true"
                            style={{
                              width: 24,
                              height: 24,
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span
                          style={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </div>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )
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
              background: theme.body.spacerBackground,
            }}
          />
        </tr>
      ) : null}
    </tbody>
  );
}
