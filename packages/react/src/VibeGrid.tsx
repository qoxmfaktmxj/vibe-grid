/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useId, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  activateRow,
  beginEditSession,
  createSelectionState,
  isEditingCell,
  setActiveCell,
  toggleRowSelection,
  updateEditSessionDraft,
  type GridEditSession,
  type GridSelectionState,
  type ManagedGridRow,
  type RowState,
  type VibeGridColumn,
} from "@vibe-grid/core";
import { createTanStackColumns } from "@vibe-grid/tanstack-adapter";

type RowRecord = Record<string, unknown>;

type InternalColumnMeta = {
  columnKey?: string;
  editable?: boolean;
  internal?: boolean;
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

export function VibeGrid<Row extends RowRecord>({
  gridId,
  rows,
  columns,
  selectionState,
  onSelectionStateChange,
  editSession,
  onEditSessionChange,
  onCellEditCommit,
  emptyMessage = "조회할 데이터가 없습니다.",
  height = 420,
}: VibeGridProps<Row>) {
  const inputId = useId();
  const resolvedSelectionState =
    selectionState ?? createSelectionState({ activeRowId: rows[0]?.meta.rowKey });
  const rowMetaByKey = useMemo(
    () =>
      new Map(rows.map((managedRow) => [managedRow.meta.rowKey, managedRow.meta])),
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
        meta: {
          columnKey: "__rowNumber",
          internal: true,
        } satisfies InternalColumnMeta,
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
        meta: {
          columnKey: "__rowState",
          internal: true,
        } satisfies InternalColumnMeta,
      },
      ...createTanStackColumns(columns),
    ],
    [columns, rowMetaByKey],
  );

  const table = useReactTable({
    data: tableData,
    columns: businessColumns,
    getRowId: (_row, index) => rows[index]?.meta.rowKey ?? `${gridId}-${index}`,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
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
            width: "100%",
            minWidth: 980,
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      background: "#f8fafc",
                      borderBottom: "1px solid #d9e4f1",
                      color: "#0f172a",
                      fontSize: 13,
                      fontWeight: 800,
                      padding: "14px 16px",
                      textAlign: "left",
                      width: header.getSize(),
                      minWidth: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getAllLeafColumns().length}
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

                return (
                  <tr
                    key={row.id}
                    style={{
                      background: isActive
                        ? "linear-gradient(90deg, rgba(14,165,233,0.12), rgba(255,255,255,0.98))"
                        : isSelected
                          ? "rgba(14,165,233,0.07)"
                          : "#fff",
                      cursor: "default",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const columnMeta = cell.column.columnDef.meta as
                        | InternalColumnMeta
                        | undefined;
                      const isActiveCell =
                        resolvedSelectionState.activeCell?.rowKey === row.id &&
                        resolvedSelectionState.activeCell.columnKey ===
                          columnMeta?.columnKey;
                      const editing =
                        !!columnMeta?.columnKey &&
                        isEditingCell(editSession, row.id, columnMeta.columnKey);
                      const baseValue = cell.getValue();

                      return (
                        <td
                          key={cell.id}
                          onClick={(event) => {
                            const preserveSelection =
                              event.ctrlKey || event.metaKey;
                            const nextBaseState = preserveSelection
                              ? toggleRowSelection(resolvedSelectionState, row.id)
                              : activateRow(resolvedSelectionState, row.id);
                            const nextState =
                              columnMeta?.internal || !columnMeta?.columnKey
                                ? {
                                    ...nextBaseState,
                                    activeCell: undefined,
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
                            borderBottom: "1px solid #eef2f7",
                            padding: "14px 16px",
                            color: meta?.state === "D" ? "#94a3b8" : "#0f172a",
                            fontSize: 14,
                            fontWeight: isActive ? 700 : 500,
                            verticalAlign: "middle",
                            boxShadow: isActiveCell
                              ? "inset 0 0 0 2px #0ea5e9"
                              : undefined,
                            background: isActiveCell
                              ? "rgba(14,165,233,0.08)"
                              : undefined,
                          }}
                        >
                          {editing ? (
                            <label htmlFor={`${inputId}-${row.id}-${columnMeta?.columnKey}`}>
                              <span style={{ display: "none" }}>
                                {columnMeta?.columnKey}
                              </span>
                              <input
                                id={`${inputId}-${row.id}-${columnMeta?.columnKey}`}
                                autoFocus
                                value={editSession?.draftValue ?? ""}
                                onChange={(event) => {
                                  if (!editSession) {
                                    return;
                                  }

                                  onEditSessionChange?.(
                                    updateEditSessionDraft(
                                      editSession,
                                      event.target.value,
                                    ),
                                  );
                                }}
                                onBlur={() => {
                                  if (!editSession || !columnMeta?.columnKey) {
                                    return;
                                  }

                                  onCellEditCommit?.({
                                    rowKey: row.id,
                                    columnKey: columnMeta.columnKey,
                                    draftValue: editSession.draftValue,
                                  });
                                }}
                                onKeyDown={(event) => {
                                  if (!editSession || !columnMeta?.columnKey) {
                                    return;
                                  }

                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    onCellEditCommit?.({
                                      rowKey: row.id,
                                      columnKey: columnMeta.columnKey,
                                      draftValue: editSession.draftValue,
                                    });
                                  }

                                  if (event.key === "Escape") {
                                    event.preventDefault();
                                    onEditSessionChange?.(null);
                                  }
                                }}
                                style={{
                                  width: "100%",
                                  border: "1px solid #38bdf8",
                                  borderRadius: 10,
                                  padding: "8px 10px",
                                  font: "inherit",
                                }}
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
