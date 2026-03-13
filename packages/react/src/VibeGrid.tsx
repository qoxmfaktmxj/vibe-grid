/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect, useId, useMemo, useRef } from "react";
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
import {
  createSelectionState,
  getNormalizedCellRange,
  hasRangeSelection,
  sanitizeGridColumnState,
  type GridColumnState,
  type GridEditSession,
  type GridFilter,
  type GridSelectionState,
  type GridSortRule,
  type ManagedGridRow,
  type RowState,
  type VibeGridColumn,
} from "@vibe-grid/core";
import { createTanStackColumns } from "@vibe-grid/tanstack-adapter";
import { VibeGridTableBody } from "./internal/VibeGridTableBody";
import { VibeGridTableHeader } from "./internal/VibeGridTableHeader";
import type {
  GridActiveCellLike,
  InternalColumnMeta,
  RowRecord,
} from "./internal/vibe-grid-types";
import { resolveUpdater } from "./internal/vibe-grid-utils";

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
  columnState?: GridColumnState;
  onColumnStateChange?: (state: GridColumnState) => void;
  sorting?: GridSortRule[];
  onSortingChange?: (sorting: GridSortRule[]) => void;
  filters?: GridFilter[];
  onFiltersChange?: (filters: GridFilter[]) => void;
  enableFilterRow?: boolean;
  emptyMessage?: string;
  height?: number;
};

const rowStateLabel: Record<RowState, string> = {
  N: "?뺤긽",
  I: "?낅젰",
  U: "?섏젙",
  D: "??젣",
};

const rowStateColor: Record<RowState, { background: string; color: string }> = {
  N: { background: "#eff6ff", color: "#1d4ed8" },
  I: { background: "#ecfdf5", color: "#047857" },
  U: { background: "#fff7ed", color: "#c2410c" },
  D: { background: "#fef2f2", color: "#b91c1c" },
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
  columnState,
  onColumnStateChange,
  sorting,
  onSortingChange,
  filters,
  onFiltersChange,
  enableFilterRow = false,
  emptyMessage = "議고쉶???곗씠?곌? ?놁뒿?덈떎.",
  height = 420,
}: VibeGridProps<Row>) {
  const inputId = useId();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragRangeRef = useRef<{
    anchor: GridActiveCellLike;
    moved: boolean;
  } | null>(null);
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
        } satisfies InternalColumnMeta<Row>,
      },
      {
        id: "__rowState",
        header: "?곹깭",
        cell: ({ row }) => {
          const state = rowMetaByKey.get(row.id)?.state ?? "N";
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
        } satisfies InternalColumnMeta<Row>,
      },
      ...createTanStackColumns(columns),
    ];
  }, [columns, rowMetaByKey]);

  const visibilityState = useMemo<VisibilityState>(() => {
    const visibility: VisibilityState = {};

    for (const column of columns) {
      visibility[column.key] = resolvedColumnState.visibility[column.key] !== false;
    }

    return visibility;
  }, [columns, resolvedColumnState.visibility]);

  const columnOrderState = useMemo<ColumnOrderState>(
    () => ["__rowNumber", "__rowState", ...resolvedColumnState.order],
    [resolvedColumnState.order],
  );

  const columnPinningState = useMemo<ColumnPinningState>(
    () => ({
      left: ["__rowNumber", "__rowState", ...resolvedColumnState.pinning.left],
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
    columnResizeMode: "onChange",
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
  );

  useEffect(() => {
    const handleMouseUp = () => {
      if (!dragRangeRef.current) {
        return;
      }

      suppressClickRef.current = dragRangeRef.current.moved;
      dragRangeRef.current = null;
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

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

  return (
    <div
      ref={gridRef}
      tabIndex={0}
      data-testid="vibe-grid"
      data-selection-mode={resolvedSelectionState.mode ?? "row"}
      data-range-anchor={resolvedSelectionState.range?.anchor.columnKey}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
          if (hasRangeSelection(resolvedSelectionState)) {
            event.preventDefault();
            copyRangeToClipboard();
          }
        }
      }}
      style={{
        border: "1px solid #d9e4f1",
        borderRadius: 24,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 16px 50px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div style={{ overflow: "auto", maxHeight: height }}>
        <table
          style={{
            width: Math.max(table.getTotalSize(), 980),
            minWidth: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            tableLayout: "fixed",
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
            rowMetaByKey={rowMetaByKey}
            selectionState={resolvedSelectionState}
            editSession={editSession}
            onSelectionStateChange={onSelectionStateChange}
            onEditSessionChange={onEditSessionChange}
            onCellEditCommit={onCellEditCommit}
            emptyMessage={emptyMessage}
            inputId={inputId}
            rowIndexByKey={rowIndexByKey}
            columnIndexByKey={columnIndexByKey}
            normalizedRange={normalizedRange}
            focusGridSurface={focusGridSurface}
            dragRangeRef={dragRangeRef}
            suppressClickRef={suppressClickRef}
          />
        </table>
      </div>
    </div>
  );
}
