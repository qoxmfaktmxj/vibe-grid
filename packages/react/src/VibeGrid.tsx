/* eslint-disable react-hooks/incompatible-library */
"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  activateRow,
  beginRangeSelection,
  beginEditSession,
  clearRangeSelection,
  createSelectionState,
  getNormalizedCellRange,
  hasRangeSelection,
  isEditingCell,
  sanitizeGridColumnState,
  setActiveCell,
  toggleRowSelection,
  updateRangeSelection,
  updateEditSessionDraft,
  type GridColumnState,
  type GridEditorSpec,
  type GridEditSession,
  type GridSelectionState,
  type GridSortRule,
  type ManagedGridRow,
  type RowState,
  type VibeGridColumn,
} from "@vibe-grid/core";
import { createTanStackColumns } from "@vibe-grid/tanstack-adapter";

type RowRecord = Record<string, unknown>;

type InternalColumnMeta<Row extends RowRecord = RowRecord> = {
  columnKey?: string;
  editable?: boolean;
  internal?: boolean;
  editor?: GridEditorSpec<Row>;
};

type GridActiveCellLike = {
  rowKey: string;
  columnKey: string;
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
  columnState?: GridColumnState;
  onColumnStateChange?: (state: GridColumnState) => void;
  sorting?: GridSortRule[];
  onSortingChange?: (sorting: GridSortRule[]) => void;
  emptyMessage?: string;
  height?: number;
};

const rowStateLabel: Record<RowState, string> = {
  N: "정상",
  I: "입력",
  U: "수정",
  D: "삭제",
};

const rowStateColor: Record<RowState, { background: string; color: string }> = {
  N: { background: "#eff6ff", color: "#1d4ed8" },
  I: { background: "#ecfdf5", color: "#047857" },
  U: { background: "#fff7ed", color: "#c2410c" },
  D: { background: "#fef2f2", color: "#b91c1c" },
};

function resolveUpdater<Value>(updater: Updater<Value>, current: Value): Value {
  return typeof updater === "function"
    ? (updater as (previous: Value) => Value)(current)
    : updater;
}

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
  emptyMessage = "조회된 데이터가 없습니다.",
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

  const businessColumns = useMemo<ColumnDef<Row>[]>(
    () => [
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
        header: "상태",
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
    ],
    [columns, rowMetaByKey],
  );

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
            Object.entries(nextSizing).filter(
              ([columnKey]) => !columnKey.startsWith("__"),
            ),
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
  const visibleBusinessColumnKeys = table
    .getVisibleLeafColumns()
    .flatMap((column) => {
      const meta = column.columnDef.meta as InternalColumnMeta<Row> | undefined;
      return meta?.internal || !meta?.columnKey ? [] : [meta.columnKey];
    });
  const rowIndexByKey = useMemo(
    () => new Map(rowOrder.map((rowKey, index) => [rowKey, index])),
    [rowOrder],
  );
  const columnIndexByKey = useMemo(
    () =>
      new Map(
        visibleBusinessColumnKeys.map((columnKey, index) => [columnKey, index]),
      ),
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

  function focusGridSurface() {
    gridRef.current?.focus({ preventScroll: true });
  }

  function copyRangeToClipboard() {
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
  }

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
          <thead style={{ position: "sticky", top: 0, zIndex: 4 }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const headerColumn = header.column;
                  const headerMeta = headerColumn.columnDef.meta as
                    | InternalColumnMeta<Row>
                    | undefined;
                  const pinned = headerColumn.getIsPinned();
                  const background = "#f8fafc";
                  const stickyStyle = getStickyCellStyle(headerColumn, background, true);
                  const sorted = headerColumn.getIsSorted();
                  const canSort = headerColumn.getCanSort() && !headerMeta?.internal;

                  return (
                    <th
                      key={header.id}
                      style={{
                        ...stickyStyle,
                        borderBottom: "1px solid #d9e4f1",
                        color: "#0f172a",
                        fontSize: 13,
                        fontWeight: 800,
                        padding: "0 16px",
                        textAlign: "left",
                        width: header.getSize(),
                        minWidth: header.getSize(),
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          minHeight: 50,
                        }}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={headerColumn.getToggleSortingHandler()}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              font: "inherit",
                              fontWeight: 800,
                              color: "#0f172a",
                              cursor: "pointer",
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            <span
                              style={{
                                fontSize: 11,
                                color: sorted ? "#0f766e" : "#94a3b8",
                              }}
                            >
                              {sorted === "asc"
                                ? "▲"
                                : sorted === "desc"
                                  ? "▼"
                                  : "↕"}
                            </span>
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}

                        {headerColumn.getCanResize() ? (
                          <div
                            onDoubleClick={() => headerColumn.resetSize()}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            style={{
                              width: 10,
                              height: 30,
                              cursor: "col-resize",
                              display: "grid",
                              placeItems: "center",
                              marginRight: -12,
                              userSelect: "none",
                            }}
                          >
                            <div
                              style={{
                                width: 2,
                                height: 18,
                                borderRadius: 999,
                                background:
                                  pinned && sorted
                                    ? "rgba(15,118,110,0.45)"
                                    : "rgba(148,163,184,0.5)",
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
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
            ) : (
              table.getRowModel().rows.map((row) => {
                const isActive = row.id === resolvedSelectionState.activeRowId;
                const isSelected = resolvedSelectionState.selectedRowIds.has(row.id);
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
                        resolvedSelectionState.activeCell?.rowKey === row.id &&
                        resolvedSelectionState.activeCell.columnKey ===
                          columnMeta?.columnKey;
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
                          data-row-key={row.id}
                          data-column-key={columnMeta?.columnKey}
                          data-range-selected={rangeState.inRange ? "true" : "false"}
                          data-active-cell={isActiveCell ? "true" : "false"}
                          onMouseDown={(event) => {
                            focusGridSurface();

                            if (columnMeta?.internal || !columnMeta?.columnKey) {
                              return;
                            }

                            if (event.shiftKey && resolvedSelectionState.activeCell) {
                              suppressClickRef.current = true;
                              onSelectionStateChange?.(
                                updateRangeSelection(
                                  beginRangeSelection(
                                    createSelectionState({
                                      activeRowId:
                                        resolvedSelectionState.activeCell.rowKey,
                                      activeCell: resolvedSelectionState.activeCell,
                                    }),
                                    resolvedSelectionState.activeCell,
                                  ),
                                  {
                                    rowKey: row.id,
                                    columnKey: columnMeta.columnKey,
                                  },
                                ),
                              );
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
                              updateRangeSelection(
                                beginRangeSelection(
                                  createSelectionState({
                                    activeRowId: dragState.anchor.rowKey,
                                    activeCell: dragState.anchor,
                                  }),
                                  dragState.anchor,
                                ),
                                {
                                  rowKey: row.id,
                                  columnKey: columnMeta.columnKey,
                                },
                              ),
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
                              updateRangeSelection(
                                beginRangeSelection(
                                  createSelectionState({
                                    activeRowId: dragState.anchor.rowKey,
                                    activeCell: dragState.anchor,
                                  }),
                                  dragState.anchor,
                                ),
                                {
                                  rowKey: row.id,
                                  columnKey: columnMeta.columnKey,
                                },
                              ),
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
                              columnMeta?.columnKey &&
                              resolvedSelectionState.activeCell
                            ) {
                              onSelectionStateChange?.(
                                updateRangeSelection(
                                  beginRangeSelection(
                                    createSelectionState({
                                      activeRowId:
                                        resolvedSelectionState.activeCell.rowKey,
                                      activeCell: resolvedSelectionState.activeCell,
                                    }),
                                    resolvedSelectionState.activeCell,
                                  ),
                                  {
                                    rowKey: row.id,
                                    columnKey: columnMeta.columnKey,
                                  },
                                ),
                              );
                              return;
                            }

                            const preserveSelection = event.ctrlKey || event.metaKey;
                            const nextBaseState = preserveSelection
                              ? toggleRowSelection(resolvedSelectionState, row.id)
                              : activateRow(
                                  clearRangeSelection(resolvedSelectionState),
                                  row.id,
                                );
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
                                ? "#e0f2fe"
                                : (rangeBackground ?? rowBackground),
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
                              <span style={{ display: "none" }}>
                                {columnMeta?.columnKey}
                              </span>
                              {renderInlineEditor({
                                inputId,
                                rowId: row.id,
                                columnKey: columnMeta?.columnKey,
                                editor: columnMeta?.editor,
                                row: row.original,
                                editSession,
                                onEditSessionChange,
                                onCellEditCommit,
                              })}
                            </label>
                          ) : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderInlineEditor<Row extends RowRecord>(input: {
  inputId: string;
  rowId: string;
  columnKey?: string;
  editor?: GridEditorSpec<Row>;
  row: Row;
  editSession: GridEditSession | null | undefined;
  onEditSessionChange?: (session: GridEditSession | null) => void;
  onCellEditCommit?: (input: {
    rowKey: string;
    columnKey: string;
    draftValue: string;
  }) => void;
}) {
  const {
    inputId,
    rowId,
    columnKey,
    editor,
    row,
    editSession,
    onEditSessionChange,
    onCellEditCommit,
  } = input;

  if (!editSession || !columnKey) {
    return null;
  }

  const commonStyle = {
    width: "100%",
    border: "1px solid #38bdf8",
    borderRadius: 10,
    padding: "8px 10px",
    font: "inherit",
    background: "#fff",
  } as const;

  const commit = (draftValue = editSession.draftValue) => {
    onCellEditCommit?.({
      rowKey: rowId,
      columnKey,
      draftValue,
    });
  };

  const cancel = () => {
    onEditSessionChange?.(null);
  };

  const onKeyDown = (
    event: ReactKeyboardEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }

    if (editor?.type === "textarea") {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        commit();
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }
  };

  const commonProps = {
    id: `${inputId}-${rowId}-${columnKey}`,
    autoFocus: true,
    value: editSession.draftValue,
    onBlur: () => commit(),
    style: commonStyle,
  } as const;

  if (editor?.type === "select") {
    const options =
      typeof editor.options === "function" ? editor.options(row) : editor.options;

    return (
      <select
        {...commonProps}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          onEditSessionChange?.(
            updateEditSessionDraft(editSession, event.target.value),
          );
          commit(event.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (editor?.type === "textarea") {
    return (
      <textarea
        {...commonProps}
        rows={editor.rows ?? 4}
        placeholder={editor.placeholder}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          onEditSessionChange?.(
            updateEditSessionDraft(editSession, event.target.value),
          );
        }}
        style={{
          ...commonStyle,
          minHeight: 88,
          resize: "vertical",
        }}
      />
    );
  }

  if (editor?.type === "number") {
    return (
      <input
        {...commonProps}
        type="number"
        min={editor.min}
        max={editor.max}
        step={editor.step}
        placeholder={editor.placeholder}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          onEditSessionChange?.(
            updateEditSessionDraft(editSession, event.target.value),
          );
        }}
      />
    );
  }

  return (
    <input
      {...commonProps}
      type="text"
      placeholder={editor?.placeholder}
      onKeyDown={onKeyDown}
      onChange={(event) => {
        onEditSessionChange?.(
          updateEditSessionDraft(editSession, event.target.value),
        );
      }}
    />
  );
}

function getCellRangeState(input: {
  normalizedRange: ReturnType<typeof getNormalizedCellRange>;
  rowKey: string;
  columnKey?: string;
  rowIndexByKey: Map<string, number>;
  columnIndexByKey: Map<string, number>;
}) {
  if (!input.normalizedRange || !input.columnKey) {
    return {
      inRange: false,
      isTop: false,
      isRight: false,
      isBottom: false,
      isLeft: false,
    };
  }

  const rowIndex = input.rowIndexByKey.get(input.rowKey);
  const columnIndex = input.columnIndexByKey.get(input.columnKey);

  if (rowIndex == null || columnIndex == null) {
    return {
      inRange: false,
      isTop: false,
      isRight: false,
      isBottom: false,
      isLeft: false,
    };
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

function buildRangeShadow(rangeState: ReturnType<typeof getCellRangeState>) {
  if (!rangeState.inRange) {
    return undefined;
  }

  return [
    rangeState.isTop ? "inset 0 2px 0 0 #14b8a6" : undefined,
    rangeState.isRight ? "inset -2px 0 0 0 #14b8a6" : undefined,
    rangeState.isBottom ? "inset 0 -2px 0 0 #14b8a6" : undefined,
    rangeState.isLeft ? "inset 2px 0 0 0 #14b8a6" : undefined,
  ]
    .filter(Boolean)
    .join(", ");
}

function getStickyCellStyle<Row extends RowRecord>(
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
      ? "2px 0 0 0 #d9e4f1, 10px 0 14px -14px rgba(15, 23, 42, 0.32)"
      : isRight && column.getIsFirstColumn("right")
        ? "-2px 0 0 0 #d9e4f1, -10px 0 14px -14px rgba(15, 23, 42, 0.32)"
        : undefined,
  };
}
