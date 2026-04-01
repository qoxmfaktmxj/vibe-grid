import { useState, type KeyboardEvent } from "react";
import type {
  GridEditorOption,
  GridEditorSpec,
  GridFilter,
  GridFilterEditorSpec,
} from "@vibe-grid/core";
import type { Table } from "@tanstack/react-table";
import type { VibeGridThemeTokens } from "@vibe-grid/theme-shadcn";
import { defaultLocale, getGridMessage, gridMessageKeys } from "@vibe-grid/i18n";
import type { InternalColumnMeta, RowRecord } from "./vibe-grid-types";
import { getStickyCellStyle } from "./vibe-grid-utils";

type VibeGridFilterRowProps<Row extends RowRecord> = {
  table: Table<Row>;
  filters?: GridFilter[];
  onFiltersChange?: (filters: GridFilter[]) => void;
  theme: VibeGridThemeTokens;
};

function buildFilterSyncSignature<Row extends RowRecord>(
  visibleColumns: ReturnType<Table<Row>["getVisibleLeafColumns"]>,
  filters: GridFilter[],
) {
  return JSON.stringify({
    columns: visibleColumns.map((column) => column.id),
    filters: filters.map((filter) => ({
      field: filter.field,
      op: filter.op,
      value: filter.value,
    })),
  });
}

function resolveFilterEditor<Row extends RowRecord>(
  meta?: InternalColumnMeta<Row>,
): GridFilterEditorSpec | null {
  if (!meta?.filterable) {
    return null;
  }

  if (meta.filterEditor) {
    return meta.filterEditor;
  }

  if (meta.editor?.type === "number") {
    return { type: "number" };
  }

  if (meta.editor?.type === "select") {
    const options = resolveSelectOptions(meta.editor);
    if (options.length > 0) {
      return {
        type: "select",
        options,
        emptyLabel: getGridMessage(gridMessageKeys.filterSelectAll, defaultLocale),
      };
    }
  }

  return { type: "text" };
}

function resolveSelectOptions<Row extends RowRecord>(
  editor?: GridEditorSpec<Row>,
): GridEditorOption[] {
  if (editor?.type !== "select") {
    return [];
  }

  return Array.isArray(editor.options) ? editor.options : [];
}

function getFilterDraftValue(filters: GridFilter[], field: string) {
  const current = filters.find((filter) => filter.field === field);
  return current?.value == null ? "" : String(current.value);
}

function createDraftMap<Row extends RowRecord>(
  visibleColumns: ReturnType<Table<Row>["getVisibleLeafColumns"]>,
  filters: GridFilter[],
) {
  const nextDrafts: Record<string, string> = {};

  for (const column of visibleColumns) {
    const meta = column.columnDef.meta as InternalColumnMeta<Row> | undefined;
    if (!meta?.columnKey) {
      continue;
    }

    nextDrafts[meta.columnKey] = getFilterDraftValue(filters, meta.columnKey);
  }

  return nextDrafts;
}

function createNextFilters(
  filters: GridFilter[],
  field: string,
  nextFilter?: GridFilter,
) {
  return [
    ...filters.filter((filter) => filter.field !== field),
    ...(nextFilter ? [nextFilter] : []),
  ];
}

function buildNextFilter(
  field: string,
  filterEditor: GridFilterEditorSpec,
  rawValue: string,
): GridFilter | undefined {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return undefined;
  }

  if (filterEditor.type === "number") {
    const value = Number(trimmed);
    if (!Number.isFinite(value)) {
      return undefined;
    }

    return {
      field,
      op: filterEditor.op ?? "eq",
      value,
    };
  }

  if (filterEditor.type === "select") {
    return {
      field,
      op: filterEditor.op ?? "eq",
      value: rawValue,
    };
  }

  return {
    field,
    op: filterEditor.op ?? "contains",
    value: trimmed,
  };
}

export function VibeGridFilterRow<Row extends RowRecord>({
  table,
  filters = [],
  onFiltersChange,
  theme,
}: VibeGridFilterRowProps<Row>) {
  const visibleColumns = table.getVisibleLeafColumns();
  const syncSignature = buildFilterSyncSignature(visibleColumns, filters);
  const synchronizedDrafts = createDraftMap(visibleColumns, filters);
  const [draftState, setDraftState] = useState(() => ({
    signature: syncSignature,
    drafts: synchronizedDrafts,
  }));
  const drafts =
    draftState.signature === syncSignature ? draftState.drafts : synchronizedDrafts;

  if (!onFiltersChange) {
    return null;
  }

  return (
    <tr data-testid="grid-filter-row">
      {visibleColumns.map((column) => {
        const meta = column.columnDef.meta as InternalColumnMeta<Row> | undefined;
        const filterEditor = resolveFilterEditor(meta);
        const columnKey = meta?.columnKey;
        const pinned = column.getIsPinned();
        const background = pinned
          ? theme.header.pinnedBackground
          : theme.filter.rowBackground;
        const stickyStyle = getStickyCellStyle(column, background, true, false, theme);
        const draftValue = columnKey ? drafts[columnKey] ?? "" : "";
        const isInvalidNumber =
          filterEditor?.type === "number" &&
          draftValue.trim().length > 0 &&
          !Number.isFinite(Number(draftValue));

        const applyFilter = () => {
          if (!columnKey || !filterEditor) {
            return;
          }

          const nextFilter = buildNextFilter(columnKey, filterEditor, draftValue);
          const nextFilters = createNextFilters(filters, columnKey, nextFilter);
          onFiltersChange(nextFilters);
        };

        const clearFilter = () => {
          if (!columnKey) {
            return;
          }

          setDraftState({
            signature: syncSignature,
            drafts: {
              ...drafts,
              [columnKey]: "",
            },
          });
          onFiltersChange(createNextFilters(filters, columnKey));
        };

        const onTextKeyDown = (
          event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
        ) => {
          if (event.key === "Enter") {
            event.preventDefault();
            applyFilter();
          }
        };

        return (
          <th
            key={`filter-${column.id}`}
            data-testid={columnKey ? `filter-cell-${columnKey}` : undefined}
            style={{
              ...stickyStyle,
              borderBottom: `1px solid ${theme.header.borderColor}`,
              padding: "8px 12px 10px",
              width: column.getSize(),
              minWidth: column.getSize(),
              verticalAlign: "top",
            }}
          >
            {!columnKey || !filterEditor ? (
              <div style={{ minHeight: 38 }} />
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {filterEditor.type === "select" ? (
                  <select
                    data-testid={`filter-input-${columnKey}`}
                    value={draftValue}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setDraftState({
                        signature: syncSignature,
                        drafts: {
                          ...drafts,
                          [columnKey]: nextValue,
                        },
                      });
                      onFiltersChange(
                        createNextFilters(
                          filters,
                          columnKey,
                          buildNextFilter(columnKey, filterEditor, nextValue),
                        ),
                      );
                    }}
                    onKeyDown={onTextKeyDown}
                    style={{
                      width: "100%",
                      minHeight: 34,
                      borderRadius: 6,
                      border: `1px solid ${theme.filter.inputBorder}`,
                      padding: "0 10px",
                      background: theme.filter.inputBackground,
                      color: theme.filter.inputText,
                      font: "inherit",
                      fontSize: 12,
                      fontWeight: 400,
                    }}
                  >
                    <option value="">{filterEditor.emptyLabel ?? getGridMessage(gridMessageKeys.filterSelectAll, defaultLocale)}</option>
                    {filterEditor.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    data-testid={`filter-input-${columnKey}`}
                    type={filterEditor.type === "number" ? "number" : "text"}
                    value={draftValue}
                    placeholder={filterEditor.placeholder}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setDraftState({
                        signature: syncSignature,
                        drafts: {
                          ...drafts,
                          [columnKey]: nextValue,
                        },
                      });
                    }}
                    onKeyDown={onTextKeyDown}
                    style={{
                      width: "100%",
                      minHeight: 34,
                      borderRadius: 6,
                      border: isInvalidNumber
                        ? `1px solid ${theme.filter.invalidBorder}`
                        : draftValue
                          ? `1px solid ${theme.filter.inputBorderFocus}`
                          : `1px solid ${theme.filter.inputBorder}`,
                      padding: "0 10px",
                      background: draftValue
                        ? theme.filter.inputHasValueBackground
                        : theme.filter.inputBackground,
                      color: theme.filter.inputText,
                      font: "inherit",
                      fontSize: 12,
                      fontWeight: 400,
                      outline: "none",
                    }}
                  />
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  {filterEditor.type === "select" ? null : (
                    <button
                      type="button"
                      data-testid={`filter-apply-${columnKey}`}
                      onClick={applyFilter}
                      disabled={isInvalidNumber}
                      style={{
                        flex: 1,
                        minHeight: 28,
                        borderRadius: 6,
                        border: "1px solid transparent",
                        background: theme.filter.applyBackground,
                        color: theme.filter.applyText,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: isInvalidNumber ? "not-allowed" : "pointer",
                        opacity: isInvalidNumber ? 0.5 : 1,
                      }}
                    >
                      {getGridMessage(gridMessageKeys.filterApply, defaultLocale)}
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid={`filter-clear-${columnKey}`}
                    onClick={clearFilter}
                    style={{
                      minWidth: filterEditor.type === "select" ? "100%" : 48,
                      minHeight: 28,
                      borderRadius: 6,
                      border: `1px solid ${theme.filter.clearBorder}`,
                      background: theme.filter.clearBackground,
                      color: theme.filter.clearText,
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {getGridMessage(gridMessageKeys.filterClear, defaultLocale)}
                  </button>
                </div>
              </div>
            )}
          </th>
        );
      })}
    </tr>
  );
}
