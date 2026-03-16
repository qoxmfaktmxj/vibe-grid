/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import type { ClipboardEvent as ReactClipboardEvent } from "react";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualRows } from "@vibe-grid/virtualization";
import {
  beginRangeSelection,
  createSelectionState,
  extendRangeByArrow,
  getNormalizedCellRange,
  getSelectionAnchorCell,
  hasRangeSelection,
  moveActiveCellByArrow,
  sanitizeGridColumnState,
  updateRangeSelection,
  type GridActiveCell,
  type GridColumnState,
  type GridEditActivation,
  type GridEditSession,
  type GridFilter,
  type GridSelectionState,
  type GridSortRule,
  type ManagedGridRow,
  type RowState,
  type VibeGridColumn,
} from "@vibe-grid/core";
import { vibeGridThemeTokens } from "@vibe-grid/theme-shadcn";
import { createTanStackColumns } from "@vibe-grid/tanstack-adapter";
import { VibeGridTableBody } from "./internal/VibeGridTableBody";
import { VibeGridTableHeader } from "./internal/VibeGridTableHeader";
import type {
  GridActiveCellLike,
  InternalColumnMeta,
  RowRecord,
} from "./internal/vibe-grid-types";
import { resolveUpdater } from "./internal/vibe-grid-utils";

function buildDragSelectionState(
  anchor: GridActiveCellLike,
  focus: GridActiveCellLike,
) {
  return updateRangeSelection(
    beginRangeSelection(
      createSelectionState({
        activeRowId: anchor.rowKey,
        activeCell: anchor,
      }),
      anchor,
    ),
    focus,
  );
}

function areSameCell(
  left: GridActiveCellLike | undefined,
  right: GridActiveCellLike | undefined,
) {
  return !!left && !!right && left.rowKey === right.rowKey && left.columnKey === right.columnKey;
}

function shouldIgnoreClipboardPasteTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return target.closest("input, textarea, select, [contenteditable='true']") != null;
}

const DEFAULT_GRID_ROW_HEIGHT = 42;

export type GridClipboardPasteInput = {
  text: string;
  anchorCell?: GridActiveCell;
  visibleColumnKeys: string[];
};

export type VibeGridProps<Row extends RowRecord> = {
  gridId: string;
  rows: ManagedGridRow<Row>[];
  columns: ReadonlyArray<VibeGridColumn<Row>>;
  selectionState?: GridSelectionState;
  onSelectionStateChange?: (state: GridSelectionState) => void;
  editSession?: GridEditSession | null;
  onEditSessionChange?: (session: GridEditSession | null) => void;
  onCellEditCommit?: (input: {
    rowKey: string;
    columnKey: string;
    draftValue: string;
  }) => void;
  onClipboardPaste?: (input: GridClipboardPasteInput) => void;
  onDeleteCheckToggle?: (rowKey: string) => void;
  editActivation?: GridEditActivation;
  columnState?: GridColumnState;
  onColumnStateChange?: (state: GridColumnState) => void;
  sorting?: GridSortRule[];
  onSortingChange?: (sorting: GridSortRule[]) => void;
  filters?: GridFilter[];
  onFiltersChange?: (filters: GridFilter[]) => void;
  enableFilterRow?: boolean;
  emptyMessage?: string;
  height?: number;
  virtualization?: {
    enabled?: boolean;
    rowHeight?: number;
    overscan?: number;
  };
};

const rowStateLabel: Record<RowState, string> = {
  N: "정상",
  I: "입력",
  U: "수정",
  D: "삭제",
};

const rowStateColor: Record<RowState, { background: string; color: string }> = {
  N: vibeGridThemeTokens.rowState.N,
  I: vibeGridThemeTokens.rowState.I,
  U: vibeGridThemeTokens.rowState.U,
  D: vibeGridThemeTokens.rowState.D,
};

export function VibeGrid<Row extends RowRecord>({
  gridId,
  rows,
  columns,
  selectionState,
  onSelectionStateChange,
  editSession,
  onEditSessionChange,
  onCellEditCommit,
  onClipboardPaste,
  onDeleteCheckToggle,
  editActivation = "doubleClick",
  columnState,
  onColumnStateChange,
  sorting,
  onSortingChange,
  filters,
  onFiltersChange,
  enableFilterRow = false,
  emptyMessage = "조회된 데이터가 없습니다.",
  height = 420,
  virtualization,
}: VibeGridProps<Row>) {
  const inputId = useId();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragRangeRef = useRef<{
    anchor: GridActiveCellLike;
    moved: boolean;
    lastFocus?: GridActiveCellLike;
    pendingFocus?: GridActiveCellLike;
  } | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const resolvedSelectionState =
    selectionState ?? createSelectionState({ activeRowId: rows[0]?.meta.rowKey });
  const resolvedColumnState = useMemo(
    () => sanitizeGridColumnState(columns, columnState),
    [columnState, columns],
  );
  const rowMetaByKey = useMemo(
    () => new Map(rows.map((managedRow) => [managedRow.meta.rowKey, managedRow.meta])),
    [rows],
  );
  const rowMetaByKeyRef = useRef(rowMetaByKey);
  rowMetaByKeyRef.current = rowMetaByKey;
  const tableData = useMemo(() => rows.map((managedRow) => managedRow.row), [rows]);

  const businessColumns = useMemo<ColumnDef<Row>[]>(() => {
    return [
      {
        id: "__rowNumber",
        header: "No",
        cell: ({ row }) => row.index + 1,
        size: 72,
        minSize: 72,
        maxSize: 72,
        enableSorting: false,
        enableResizing: false,
        meta: {
          columnKey: "__rowNumber",
          internal: true,
          internalControl: "rowNumber",
        } satisfies InternalColumnMeta<Row>,
      },
      {
        id: "__deleteCheck",
        header: "삭제",
        cell: ({ row }) => {
          const isChecked = rowMetaByKeyRef.current.get(row.id)?.state === "D";

          return (
            <span
              style={{
                display: "inline-flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                data-testid={`delete-check-${row.id}`}
                aria-label={`${row.id} 삭제 체크`}
                onChange={() => {
                  onDeleteCheckToggle?.(row.id);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                }}
                style={{
                  width: 16,
                  height: 16,
                  cursor: onDeleteCheckToggle ? "pointer" : "default",
                }}
              />
            </span>
          );
        },
        size: 88,
        minSize: 88,
        maxSize: 88,
        enableSorting: false,
        enableResizing: false,
        meta: {
          columnKey: "__deleteCheck",
          internal: true,
          internalControl: "deleteCheck",
        } satisfies InternalColumnMeta<Row>,
      },
      {
        id: "__rowState",
        header: "상태",
        cell: ({ row }) => {
          const state = rowMetaByKeyRef.current.get(row.id)?.state ?? "N";
          const palette = rowStateColor[state];

          return (
            <span
              style={{
                display: "inline-flex",
                minWidth: 54,
                justifyContent: "center",
                padding: "6px 10px",
                borderRadius: 999,
                background: palette.background,
                color: palette.color,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {rowStateLabel[state]}
            </span>
          );
        },
        size: 110,
        minSize: 110,
        maxSize: 110,
        enableSorting: false,
        enableResizing: false,
        meta: {
          columnKey: "__rowState",
          internal: true,
          internalControl: "rowState",
        } satisfies InternalColumnMeta<Row>,
      },
      ...createTanStackColumns(columns),
    ];
  }, [columns, onDeleteCheckToggle]);

  const visibilityState = useMemo<VisibilityState>(() => {
    const visibility: VisibilityState = {};

    for (const column of columns) {
      visibility[column.key] = resolvedColumnState.visibility[column.key] !== false;
    }

    return visibility;
  }, [columns, resolvedColumnState.visibility]);

  const columnOrderState = useMemo<ColumnOrderState>(
    () => ["__rowNumber", "__deleteCheck", "__rowState", ...resolvedColumnState.order],
    [resolvedColumnState.order],
  );

  const columnPinningState = useMemo<ColumnPinningState>(
    () => ({
      left: ["__rowNumber", "__deleteCheck", "__rowState", ...resolvedColumnState.pinning.left],
      right: [...resolvedColumnState.pinning.right],
    }),
    [resolvedColumnState.pinning.left, resolvedColumnState.pinning.right],
  );

  const columnSizingState = useMemo<ColumnSizingState>(
    () => resolvedColumnState.sizing,
    [resolvedColumnState.sizing],
  );

  const sortingState = useMemo<SortingState>(
    () => sorting?.map((item) => ({ id: item.id, desc: item.desc })) ?? [],
    [sorting],
  );

  const table = useReactTable({
    data: tableData,
    columns: businessColumns,
    getRowId: (_row, index) => rows[index]?.meta.rowKey ?? `${gridId}-${index}`,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    columnResizeMode: "onEnd",
    enableColumnPinning: true,
    enableColumnResizing: true,
    enableMultiSort: false,
    state: {
      columnVisibility: visibilityState,
      columnOrder: columnOrderState,
      columnPinning: columnPinningState,
      columnSizing: columnSizingState,
      sorting: sortingState,
    },
    onColumnVisibilityChange: (updater) => {
      if (!onColumnStateChange) {
        return;
      }

      const nextVisibility = resolveUpdater(updater, visibilityState);
      onColumnStateChange(
        sanitizeGridColumnState(columns, {
          ...resolvedColumnState,
          visibility: Object.fromEntries(
            columns.map((column) => [column.key, nextVisibility[column.key] !== false]),
          ),
        }),
      );
    },
    onColumnOrderChange: (updater) => {
      if (!onColumnStateChange) {
        return;
      }

      const nextOrder = resolveUpdater(updater, columnOrderState).filter(
        (columnKey) => !columnKey.startsWith("__"),
      );
      onColumnStateChange(
        sanitizeGridColumnState(columns, {
          ...resolvedColumnState,
          order: nextOrder,
        }),
      );
    },
    onColumnPinningChange: (updater) => {
      if (!onColumnStateChange) {
        return;
      }

      const nextPinning = resolveUpdater(updater, columnPinningState);
      onColumnStateChange(
        sanitizeGridColumnState(columns, {
          ...resolvedColumnState,
          pinning: {
            left: (nextPinning.left ?? []).filter((key) => !key.startsWith("__")),
            right: (nextPinning.right ?? []).filter((key) => !key.startsWith("__")),
          },
        }),
      );
    },
    onColumnSizingChange: (updater) => {
      if (!onColumnStateChange) {
        return;
      }

      const nextSizing = resolveUpdater(updater, columnSizingState);
      onColumnStateChange(
        sanitizeGridColumnState(columns, {
          ...resolvedColumnState,
          sizing: Object.fromEntries(
            Object.entries(nextSizing).filter(([columnKey]) => !columnKey.startsWith("__")),
          ),
        }),
      );
    },
    onSortingChange: (updater) => {
      if (!onSortingChange) {
        return;
      }

      const nextSorting = resolveUpdater(updater, sortingState);
      onSortingChange(nextSorting.map((item) => ({ id: item.id, desc: item.desc })));
    },
  });
  const tableRows = table.getRowModel().rows;
  const virtualizationEnabled = virtualization?.enabled === true && tableRows.length > 0;
  const resolvedRowHeight = virtualization?.rowHeight ?? DEFAULT_GRID_ROW_HEIGHT;
  const virtualizer = useVirtualRows({
    count: virtualizationEnabled ? tableRows.length : 0,
    getScrollElement: () => scrollRef.current,
    rowHeight: resolvedRowHeight,
    overscan: virtualization?.overscan ?? 10,
  });
  const virtualItems = virtualizationEnabled ? virtualizer.getVirtualItems() : [];
  const renderedRows = virtualizationEnabled
    ? virtualItems.flatMap((item) => {
        const row = tableRows[item.index];
        return row ? [row] : [];
      })
    : tableRows;
  const topSpacerHeight =
    virtualizationEnabled && virtualItems.length > 0
      ? virtualItems[0]?.start ?? 0
      : 0;
  const bottomSpacerHeight =
    virtualizationEnabled && virtualItems.length > 0
      ? Math.max(
          0,
          virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0),
        )
      : 0;

  const rowOrder = useMemo(() => rows.map((row) => row.meta.rowKey), [rows]);
  const visibleBusinessColumnKeys = table.getVisibleLeafColumns().flatMap((column) => {
    const meta = column.columnDef.meta as InternalColumnMeta<Row> | undefined;
    return meta?.internal || !meta?.columnKey ? [] : [meta.columnKey];
  });
  const rowIndexByKey = useMemo(
    () => new Map(rowOrder.map((rowKey, index) => [rowKey, index])),
    [rowOrder],
  );
  const columnIndexByKey = useMemo(
    () => new Map(visibleBusinessColumnKeys.map((columnKey, index) => [columnKey, index])),
    [visibleBusinessColumnKeys],
  );
  const normalizedRange = getNormalizedCellRange(
    resolvedSelectionState,
    rowOrder,
    visibleBusinessColumnKeys,
    {
      rowIndexByKey,
      columnIndexByKey,
    },
  );
  const selectionAnchorCell = getSelectionAnchorCell(
    resolvedSelectionState,
    rowOrder,
    visibleBusinessColumnKeys,
    {
      rowIndexByKey,
      columnIndexByKey,
    },
  );
  const rangeRowCount = normalizedRange
    ? normalizedRange.endRowIndex - normalizedRange.startRowIndex + 1
    : 0;
  const rangeColumnCount = normalizedRange
    ? normalizedRange.endColumnIndex - normalizedRange.startColumnIndex + 1
    : 0;

  useEffect(() => {
    const resolvePointerCell = (clientX: number, clientY: number) => {
      const eventTarget = document.elementFromPoint(clientX, clientY);
      const cell = eventTarget?.closest("td[data-row-key][data-column-key]");
      const rowKey = cell?.getAttribute("data-row-key");
      const columnKey = cell?.getAttribute("data-column-key");

      if (!rowKey || !columnKey) {
        return undefined;
      }

      return {
        rowKey,
        columnKey,
      } satisfies GridActiveCellLike;
    };

    const flushPendingDragTarget = (dragState: {
      anchor: GridActiveCellLike;
      moved: boolean;
      lastFocus?: GridActiveCellLike;
      pendingFocus?: GridActiveCellLike;
    }) => {
      const nextFocus = dragState.pendingFocus;

      if (
        !nextFocus ||
        areSameCell(nextFocus, dragState.anchor) ||
        areSameCell(nextFocus, dragState.lastFocus)
      ) {
        dragState.pendingFocus = undefined;
        return;
      }

      dragState.pendingFocus = undefined;
      dragState.moved = true;
      dragState.lastFocus = nextFocus;
      onSelectionStateChange?.(buildDragSelectionState(dragState.anchor, nextFocus));
    };

    const queueDragTarget = (dragState: {
      anchor: GridActiveCellLike;
      moved: boolean;
      lastFocus?: GridActiveCellLike;
      pendingFocus?: GridActiveCellLike;
    }, clientX: number, clientY: number) => {
      const nextFocus = resolvePointerCell(clientX, clientY);

      if (
        !nextFocus ||
        areSameCell(nextFocus, dragState.anchor) ||
        areSameCell(nextFocus, dragState.lastFocus) ||
        areSameCell(nextFocus, dragState.pendingFocus)
      ) {
        return;
      }

      dragState.pendingFocus = nextFocus;

      if (dragFrameRef.current != null) {
        return;
      }

      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = null;

        if (dragRangeRef.current) {
          flushPendingDragTarget(dragRangeRef.current);
        }
      });
    };

    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragRangeRef.current;

      if (!dragState || (event.buttons & 1) !== 1) {
        return;
      }

      queueDragTarget(dragState, event.clientX, event.clientY);
    };

    const handleMouseUp = (event: MouseEvent) => {
      const dragState = dragRangeRef.current;

      if (!dragState) {
        return;
      }

      queueDragTarget(dragState, event.clientX, event.clientY);

      if (dragFrameRef.current != null) {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }

      flushPendingDragTarget(dragState);

      suppressClickRef.current = dragState.moved;
      dragRangeRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      if (dragFrameRef.current != null) {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onSelectionStateChange]);

  const focusGridSurface = () => {
    gridRef.current?.focus({ preventScroll: true });
  };

  const copyRangeToClipboard = () => {
    if (!normalizedRange) {
      return;
    }

    const selectedRows = rowOrder.slice(
      normalizedRange.startRowIndex,
      normalizedRange.endRowIndex + 1,
    );
    const selectedColumns = visibleBusinessColumnKeys.slice(
      normalizedRange.startColumnIndex,
      normalizedRange.endColumnIndex + 1,
    );
    const rowMap = new Map(rows.map((row) => [row.meta.rowKey, row.row]));
    const text = selectedRows
      .map((rowKey) => {
        const row = rowMap.get(rowKey);

        return selectedColumns
          .map((columnKey) => {
            const value = row?.[columnKey as keyof Row];
            return value == null ? "" : String(value);
          })
          .join("\t");
      })
      .join("\n");

    if (!text) {
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
    }
  };

  const handleGridPaste = (event: ReactClipboardEvent<HTMLDivElement>) => {
    if (!onClipboardPaste || shouldIgnoreClipboardPasteTarget(event.target)) {
      return;
    }

    const text = event.clipboardData.getData("text/plain");

    if (!text) {
      return;
    }

    event.preventDefault();
    onClipboardPaste({
      text,
      anchorCell: selectionAnchorCell,
      visibleColumnKeys: visibleBusinessColumnKeys,
    });
  };

  return (
    <div
      ref={gridRef}
      tabIndex={0}
      data-testid="vibe-grid"
      data-selection-mode={resolvedSelectionState.mode ?? "row"}
      data-range-anchor={resolvedSelectionState.range?.anchor.columnKey}
      data-range-rows={rangeRowCount}
      data-range-columns={rangeColumnCount}
      data-virtualized={virtualizationEnabled ? "true" : "false"}
      data-total-row-count={tableRows.length}
      data-rendered-row-count={renderedRows.length}
      data-filter-count={filters?.length ?? 0}
      data-edit-activation={editActivation}
      data-filter-row-enabled={enableFilterRow ? "true" : "false"}
      data-row-height={resolvedRowHeight}
      data-pinned-left-count={columnPinningState.left?.length ?? 0}
      data-pinned-right-count={columnPinningState.right?.length ?? 0}
      onPaste={handleGridPaste}
      onKeyDown={(event) => {
        if (event.key === "Escape" && hasRangeSelection(resolvedSelectionState)) {
          event.preventDefault();
          onSelectionStateChange?.({
            ...resolvedSelectionState,
            range: undefined,
            mode: "row",
          });
          return;
        }

        if (
          event.key === "ArrowUp" ||
          event.key === "ArrowDown" ||
          event.key === "ArrowLeft" ||
          event.key === "ArrowRight"
        ) {
          const nextState = event.shiftKey
            ? extendRangeByArrow(
                resolvedSelectionState,
                event.key,
                rowOrder,
                visibleBusinessColumnKeys,
                {
                  rowIndexByKey,
                  columnIndexByKey,
                },
              )
            : moveActiveCellByArrow(
                resolvedSelectionState,
                event.key,
                rowOrder,
                visibleBusinessColumnKeys,
                {
                  rowIndexByKey,
                  columnIndexByKey,
                },
              );

          if (nextState) {
            event.preventDefault();
            onSelectionStateChange?.(nextState);
          }
          return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
          if (hasRangeSelection(resolvedSelectionState)) {
            event.preventDefault();
            copyRangeToClipboard();
          }
        }
      }}
      style={{
        border: `1px solid ${vibeGridThemeTokens.surface.borderColor}`,
        borderRadius: 24,
        overflow: "hidden",
        background: vibeGridThemeTokens.surface.background,
        boxShadow: vibeGridThemeTokens.surface.shadow,
      }}
    >
      <div
        ref={scrollRef}
        style={{
          overflow: "auto",
          maxHeight: height,
          position: "relative",
          background: vibeGridThemeTokens.surface.shellBackground,
          padding: 8,
        }}
      >
        <table
          style={{
            width: Math.max(table.getTotalSize(), 980),
            minWidth: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            tableLayout: "fixed",
            background: vibeGridThemeTokens.surface.background,
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <VibeGridTableHeader
            table={table}
            filters={filters}
            onFiltersChange={onFiltersChange}
            enableFilterRow={enableFilterRow}
          />
          <VibeGridTableBody
            table={table}
            rows={renderedRows}
            totalRowCount={tableRows.length}
            rowMetaByKey={rowMetaByKey}
            selectionState={resolvedSelectionState}
            editSession={editSession}
            onSelectionStateChange={onSelectionStateChange}
            onEditSessionChange={onEditSessionChange}
            onCellEditCommit={onCellEditCommit}
            editActivation={editActivation}
            emptyMessage={emptyMessage}
            inputId={inputId}
            rowIndexByKey={rowIndexByKey}
            columnIndexByKey={columnIndexByKey}
            normalizedRange={normalizedRange}
            focusGridSurface={focusGridSurface}
            dragRangeRef={dragRangeRef}
            suppressClickRef={suppressClickRef}
            topSpacerHeight={topSpacerHeight}
            bottomSpacerHeight={bottomSpacerHeight}
            rowHeight={virtualizationEnabled ? resolvedRowHeight : undefined}
          />
        </table>
      </div>
    </div>
  );
}
