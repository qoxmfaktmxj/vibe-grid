"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import {
  buildRectangularPastePlan,
  clipboardSkipReasonOrder,
  createClipboardSchema,
  summarizeRectangularPastePlan,
} from "@vibe-grid/clipboard";
import {
  applyRowPatch,
  beginEditSession,
  buildSaveBundle,
  clearEditSession,
  clearSelection,
  countValidationIssues,
  createDefaultCommandRegistry,
  createGridColumnState,
  createInsertedRow,
  createLoadedRow,
  createSelectionState,
  emitGridAfterPaste,
  emitGridAfterRowCopy,
  emitGridAfterSave,
  getNormalizedCellRange,
  getSelectionAnchorCell,
  getPrimarySelectedRowId,
  getRowStateCounts,
  isGridCellEditable,
  hasValidationIssues,
  markRowsSaved,
  moveGridColumn,
  pruneSelectionState,
  sanitizeGridColumnState,
  setGridColumnPinning,
  setGridColumnVisibility,
  setGridColumnWidth,
  toggleRowDeleted,
  validateManagedRows,
  type GridActiveCell,
  type GridDensity,
  type GridEditActivation,
  type GridColumnState,
  type GridEditSession,
  type GridFilter,
  type GridPageSnapshot,
  type GridPublicEventHandlers,
  type GridQuery,
  type GridSelectionState,
  type GridServerResult,
  type ManagedGridRow,
  type SaveBundle,
} from "@vibe-grid/core";
import type {
  ClipboardPlanSummary,
  ClipboardRowOverflowPolicy,
  ClipboardSkipReason,
} from "@vibe-grid/clipboard";
import {
  defaultLocale,
  formatGridMessage,
  gridMessageKeys,
  type GridMessageValues,
} from "@vibe-grid/i18n";
import {
  VibeGrid,
  resolveGridDensityMetrics,
  type GridClipboardPasteInput,
} from "@vibe-grid/react";
import {
  createBrowserGridPreferenceAdapter,
  type GridPreferenceScope,
} from "@vibe-grid/persistence";
import {
  buildGridLabServerResult,
  buildGridQuerySearchParams,
  createBlankRow,
  defaultGridQuery,
  firstEditableColumnKey,
  playgroundColumns,
  type PlaygroundRow,
  useYnOptions,
} from "../features/grid-lab/model";
import {
  createExcelTemplateBufferLazy,
  exportRowsToExcelBufferLazy,
  importExcelPreviewLazy,
  type GridExcelImportPreview,
} from "./excel-client";

const clipboardSchema = createClipboardSchema(playgroundColumns, {
  useYn: (value) => (value.trim().toUpperCase() === "N" ? "N" : "Y"),
  sortOrder: (value) => Number(value.trim() || "0"),
});

type FilterDraft = {
  keyword: string;
  useYn: "" | "Y" | "N";
};

type PasteSummary = {
  sourceLabel: string;
  summary: ClipboardPlanSummary;
};

type PublicEventLogEntry = {
  id: string;
  label: string;
};

const pasteSkipReasonLabels: Record<ClipboardSkipReason, string> = {
  emptyMatrix: "빈 매트릭스",
  missingAnchorRow: "anchor row 없음",
  missingAnchorColumn: "anchor column 없음",
  columnOverflow: "컬럼 초과",
  rowOverflow: "행 초과",
  hidden: "숨김 컬럼",
  readonly: "읽기 전용",
  validation: "검증 오류",
};

const initialServerResult = buildGridLabServerResult(defaultGridQuery);

function createLoadedRows(rows: PlaygroundRow[]) {
  return validateManagedRows(
    rows.map((row) => createLoadedRow(row.sampleCode, row)),
    playgroundColumns,
  );
}

function createDefaultSelection(rows: ManagedGridRow<PlaygroundRow>[]) {
  const firstRow = rows[0];
  if (!firstRow) {
    return clearSelection();
  }

  return createSelectionState({
    activeRowId: firstRow.meta.rowKey,
    activeCell: {
      rowKey: firstRow.meta.rowKey,
      columnKey: firstEditableColumnKey,
    },
  });
}

function normalizeSelection(
  rows: ManagedGridRow<PlaygroundRow>[],
  selection: GridSelectionState,
) {
  const nextSelection = pruneSelectionState(
    selection,
    rows.map((row) => row.meta.rowKey),
  );

  return nextSelection.activeRowId ? nextSelection : createDefaultSelection(rows);
}

function createFilters(draft: FilterDraft): GridFilter[] {
  const filters: GridFilter[] = [];

  if (draft.keyword.trim()) {
    filters.push({
      field: "keyword",
      op: "contains",
      value: draft.keyword.trim(),
    });
  }

  if (draft.useYn) {
    filters.push({
      field: "useYn",
      op: "eq",
      value: draft.useYn,
    });
  }

  return filters;
}

function triggerDownload(filename: string, buffer: ArrayBuffer) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const initialRows = createLoadedRows(initialServerResult.rows);
const gridPreferenceScope: GridPreferenceScope = {
  appId: "playground",
  userId: "demo-admin",
  gridId: "grid-lab",
};

function getStatusMessage(
  key: keyof typeof gridMessageKeys,
  values?: GridMessageValues,
) {
  return formatGridMessage(gridMessageKeys[key], values, defaultLocale);
}

export function PlaygroundWorkbench() {
  const importInputId = useId();
  const [rows, setRows] = useState(initialRows);
  const [selectionState, setSelectionState] = useState<GridSelectionState>(
    createDefaultSelection(initialRows),
  );
  const [editSession, setEditSession] = useState<GridEditSession | null>(null);
  const [density, setDensity] = useState<GridDensity>("default");
  const [editActivation, setEditActivation] =
    useState<GridEditActivation>("doubleClick");
  const [lastSaveBundle, setLastSaveBundle] =
    useState<SaveBundle<PlaygroundRow> | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    getStatusMessage("statusGridLabReady"),
  );
  const [pasteSummary, setPasteSummary] = useState<PasteSummary | null>(null);
  const [publicEventLog, setPublicEventLog] = useState<PublicEventLogEntry[]>([]);
  const [pasteRowOverflowPolicy, setPasteRowOverflowPolicy] =
    useState<ClipboardRowOverflowPolicy>("reject");
  const [importPreview, setImportPreview] =
    useState<GridExcelImportPreview<PlaygroundRow> | null>(null);
  const [query, setQuery] = useState<GridQuery>(initialServerResult.query);
  const [pageSnapshot, setPageSnapshot] = useState<GridPageSnapshot>({
    pageIndex: initialServerResult.pageIndex,
    pageSize: initialServerResult.pageSize,
    totalCount: initialServerResult.totalCount,
    pageCount: initialServerResult.pageCount,
  });
  const [filterDraft, setFilterDraft] = useState<FilterDraft>({
    keyword: "",
    useYn: "",
  });
  const [isFetching, setIsFetching] = useState(false);
  const [columnState, setColumnState] = useState<GridColumnState>(() =>
    createGridColumnState(playgroundColumns),
  );

  const appendPublicEvent = useCallback((label: string) => {
    setPublicEventLog((current) => [
      {
        id: `${Date.now()}-${current.length}`,
        label,
      },
      ...current,
    ].slice(0, 8));
  }, []);

  const commands = createDefaultCommandRegistry(defaultLocale);
  const activeRowKey = selectionState.activeRowId;
  const activeRow =
    rows.find((row) => row.meta.rowKey === activeRowKey) ??
    rows.find((row) => row.meta.rowKey === getPrimarySelectedRowId(selectionState));
  const stateCounts = getRowStateCounts(rows);
  const densityMetrics = useMemo(
    () => resolveGridDensityMetrics(density),
    [density],
  );
  const validationIssueCount = countValidationIssues(rows);
  const prettyQuery = useMemo(() => JSON.stringify(query, null, 2), [query]);
  const prettySaveBundle = useMemo(
    () => JSON.stringify(lastSaveBundle, null, 2),
    [lastSaveBundle],
  );
  const activeFiltersSummary = useMemo(
    () =>
      query.filters.map((filter) => ({
        key: `${filter.field}:${filter.op}`,
        label: `${filter.field} ${filter.op} ${String(filter.value)}`,
      })),
    [query.filters],
  );
  const visibleBusinessColumnKeys = useMemo(
    () =>
      columnState.order.filter((columnKey) => columnState.visibility[columnKey] !== false),
    [columnState.order, columnState.visibility],
  );
  const publicEvents = useMemo<GridPublicEventHandlers<PlaygroundRow, unknown>>(
    () => ({
      onBeforePaste: (event) => {
        appendPublicEvent(
          `onBeforePaste / ${event.source} / ${event.anchorCell?.columnKey ?? "no-anchor"}`,
        );
        return true;
      },
      onAfterPaste: (event) => {
        const summary = event.summary as ClipboardPlanSummary;
        appendPublicEvent(
          `onAfterPaste / applied ${summary.appliedCellCount} / skipped ${summary.skippedCellCount}`,
        );
      },
      onAfterSave: (event) => {
        appendPublicEvent(
          `onAfterSave / inserted ${event.bundle.inserted.length} / updated ${event.bundle.updated.length} / deleted ${event.bundle.deleted.length}`,
        );
      },
      onAfterRowCopy: (event) => {
        appendPublicEvent(`onAfterRowCopy / ${event.sourceRowKey} -> ${event.targetRowKey}`);
      },
    }),
    [appendPublicEvent],
  );
  const normalizedRange = useMemo(
    () =>
      getNormalizedCellRange(
        selectionState,
        rows.map((row) => row.meta.rowKey),
        visibleBusinessColumnKeys,
      ),
    [rows, selectionState, visibleBusinessColumnKeys],
  );
  const rangeSummary = useMemo(() => {
    if (!normalizedRange) {
      return null;
    }

    return {
      rows: normalizedRange.endRowIndex - normalizedRange.startRowIndex + 1,
      columns: normalizedRange.endColumnIndex - normalizedRange.startColumnIndex + 1,
      anchor: normalizedRange.anchor,
      focus: normalizedRange.focus,
    };
  }, [normalizedRange]);
  const visibleClipboardColumns = useMemo(
    () =>
      columnState.order.flatMap((columnKey) => {
        if (columnState.visibility[columnKey] === false) {
          return [];
        }

        const column = clipboardSchema.find((item) => item.key === columnKey);
        return column ? [column] : [];
      }),
    [columnState],
  );
  const gridPreferenceAdapter = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return createBrowserGridPreferenceAdapter(window.localStorage);
  }, []);

  useEffect(() => {
    if (!gridPreferenceAdapter) {
      return;
    }

    const savedColumnState = gridPreferenceAdapter.getColumnState(gridPreferenceScope);
    if (!savedColumnState) {
      return;
    }

    setColumnState(sanitizeGridColumnState(playgroundColumns, savedColumnState));
  }, [gridPreferenceAdapter]);

  useEffect(() => {
    if (!gridPreferenceAdapter) {
      return;
    }

    gridPreferenceAdapter.setColumnState(gridPreferenceScope, columnState);
  }, [columnState, gridPreferenceAdapter]);

  useEffect(() => {
    const keywordFilter = query.filters.find((filter) => filter.field === "keyword");
    const useYnFilter = query.filters.find((filter) => filter.field === "useYn");

    setFilterDraft({
      keyword: typeof keywordFilter?.value === "string" ? keywordFilter.value : "",
      useYn:
        useYnFilter?.value === "Y" || useYnFilter?.value === "N"
          ? (useYnFilter.value as FilterDraft["useYn"])
          : "",
    });
  }, [query.filters]);

  useEffect(() => {
    void loadRows(initialServerResult.query, "초기 서버 조회");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commitRows(
    nextRows: ManagedGridRow<PlaygroundRow>[],
    nextSelection = normalizeSelection(nextRows, selectionState),
  ) {
    const validatedRows = validateManagedRows(nextRows, playgroundColumns);
    startTransition(() => {
      setRows(validatedRows);
      setSelectionState(nextSelection);
    });
  }

  async function loadRows(nextQuery: GridQuery, reason: string) {
    setIsFetching(true);

    try {
      const searchParams = buildGridQuerySearchParams(nextQuery);
      const response = await fetch(`/api/grid-lab/rows?${searchParams.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = (await response.json()) as GridServerResult<PlaygroundRow>;
      const nextRows = createLoadedRows(result.rows);

      setEditSession(null);
      setLastSaveBundle(null);
      setPasteSummary(null);
      setImportPreview(null);
      setQuery(result.query);
      setPageSnapshot({
        pageIndex: result.pageIndex,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        pageCount: result.pageCount,
      });
      commitRows(nextRows, createDefaultSelection(nextRows));
      setStatusMessage(
        getStatusMessage("statusLoadSuccess", {
          reason,
          rowCount: result.rows.length,
          totalCount: result.totalCount,
          pageNumber: result.pageIndex + 1,
          pageCount: result.pageCount,
        }),
      );
    } catch (error) {
      setStatusMessage(
        getStatusMessage("statusLoadError", {
          error: error instanceof Error ? error.message : "알 수 없는 오류",
        }),
      );
    } finally {
      setIsFetching(false);
    }
  }

  function resolveVisibleClipboardColumns(visibleColumnKeys: readonly string[]) {
    return visibleColumnKeys.flatMap((columnKey) => {
      const column = clipboardSchema.find((item) => item.key === columnKey);
      return column ? [column] : [];
    });
  }

  function applyTabularText(
    text: string,
    sourceLabel: string,
    options?: {
      anchorCell?: GridActiveCell;
      visibleColumnKeys?: readonly string[];
    },
  ) {
    const rowOrder = rows.map((row) => row.meta.rowKey);
    const resolvedVisibleColumnKeys =
      options?.visibleColumnKeys ?? visibleClipboardColumns.map((column) => column.key);
    const resolvedClipboardColumns = resolveVisibleClipboardColumns(
      resolvedVisibleColumnKeys,
    );
    const plan = buildRectangularPastePlan({
      text,
      columns: resolvedClipboardColumns,
      rowOrder,
      anchor:
        options?.anchorCell ??
        getSelectionAnchorCell(
          selectionState,
          rowOrder,
          resolvedVisibleColumnKeys,
        ),
      rowOverflowPolicy: pasteRowOverflowPolicy,
      rowsByKey: new Map(rows.map((row) => [row.meta.rowKey, row.row])),
      createAppendedRow: (absoluteRowIndex) => createBlankRow(absoluteRowIndex + 1),
    });
    const summary = summarizeRectangularPastePlan(plan);

    setPasteSummary({
      sourceLabel,
      summary,
    });

    if (summary.appliedCellCount === 0 && summary.validationErrorCount === 0) {
      const firstReason = plan.skippedCells[0]?.reason;
      if (firstReason === "missingAnchorColumn") {
        setStatusMessage(getStatusMessage("statusMissingAnchorCell"));
      } else if (firstReason === "missingAnchorRow") {
        setStatusMessage(getStatusMessage("statusMissingAnchorRow"));
      } else if (firstReason === "rowOverflow" && plan.rowOverflowPolicy === "reject") {
        setStatusMessage(getStatusMessage("statusRowOverflowRejected"));
      } else {
        setStatusMessage(getStatusMessage("statusNoApplicableClipboardData"));
      }
      return;
    }

    if (summary.validationErrorCount > 0 && summary.appliedCellCount === 0) {
      setStatusMessage(
        getStatusMessage("statusPasteValidationOnly", {
          sourceLabel,
          validationCount: summary.validationErrorCount,
          skippedCount: summary.skippedCellCount,
        }),
      );
      return;
    }

    const patchMap = new Map(
      plan.patches.map((item) => [item.rowKey, item.patch] as const),
    );
    const nextRows = rows.map((row) => {
      const patch = patchMap.get(row.meta.rowKey);
      return patch ? applyRowPatch(row, patch, "paste") : row;
    });
    const appendedRows = plan.appendedRows.map((patch, index) =>
      createInsertedRow(
        `paste-${Date.now()}-${index}`,
        {
          ...createBlankRow(nextRows.length + index + 1),
          ...patch,
        },
        { source: "paste" },
      ),
    );

    commitRows([...nextRows, ...appendedRows]);
    setStatusMessage(
      getStatusMessage(
        summary.validationErrorCount > 0 || summary.skippedCellCount > 0
          ? "statusPasteAppliedWithIssues"
          : "statusPasteApplied",
        {
          sourceLabel,
          appliedCellCount: summary.appliedCellCount,
          appendedRowCount: summary.appendedRowCount,
          skippedCount: summary.skippedCellCount,
          validationCount: summary.validationErrorCount,
          rowOverflowPolicy: summary.rowOverflowPolicy,
        },
      ),
    );
    emitGridAfterPaste(publicEvents, {
      gridId: "grid-lab",
      source: sourceLabel === "그리드 직접 붙여넣기" ? "directPaste" : "command",
      summary,
    });
  }

  function handleInsert() {
    const nextRowKey = `insert-${Date.now()}`;
    const insertedRow = createInsertedRow(
      nextRowKey,
      createBlankRow(rows.length + 1),
      { source: "insert" },
    );
    const nextRows = [insertedRow, ...rows];

    setEditSession(
      beginEditSession({
        rowKey: nextRowKey,
        columnKey: firstEditableColumnKey,
        value: insertedRow.row[firstEditableColumnKey],
      }),
    );
    commitRows(
      nextRows,
      createSelectionState({
        activeRowId: nextRowKey,
        activeCell: {
          rowKey: nextRowKey,
          columnKey: firstEditableColumnKey,
        },
      }),
    );
    setStatusMessage(getStatusMessage("statusInsertRowAdded"));
  }

  function handleCopyRow() {
    const sourceRowKey = getPrimarySelectedRowId(selectionState);
    const sourceRow = rows.find((row) => row.meta.rowKey === sourceRowKey);

    if (!sourceRow) {
      setStatusMessage(getStatusMessage("statusCopyRowMissingSelection"));
      return;
    }

    const nextRowKey = `copy-${Date.now()}`;
    const copiedRow = createInsertedRow(
      nextRowKey,
      {
        ...sourceRow.row,
        sampleCode: `${sourceRow.row.sampleCode}-COPY`,
        sampleName: `${sourceRow.row.sampleName} 복사`,
      },
      {
        copiedFrom: sourceRow.meta.rowKey,
        source: "copy",
      },
    );
    const sourceIndex = rows.findIndex(
      (row) => row.meta.rowKey === sourceRow.meta.rowKey,
    );
    const nextRows = [...rows];

    nextRows.splice(sourceIndex + 1, 0, copiedRow);
    setEditSession(
      beginEditSession({
        rowKey: nextRowKey,
        columnKey: "sampleName",
        value: copiedRow.row.sampleName,
      }),
    );
    commitRows(
      nextRows,
      createSelectionState({
        activeRowId: nextRowKey,
        activeCell: {
          rowKey: nextRowKey,
          columnKey: "sampleName",
        },
      }),
    );
    setStatusMessage(getStatusMessage("statusCopyRowSuccess"));
    emitGridAfterRowCopy(publicEvents, {
      gridId: "grid-lab",
      sourceRowKey: sourceRow.meta.rowKey,
      targetRowKey: copiedRow.meta.rowKey,
      sourceRow,
      targetRow: copiedRow,
    });
  }

  function handleToggleDelete() {
    const targetRowIds = [...selectionState.selectedRowIds];

    if (targetRowIds.length === 0) {
      setStatusMessage(getStatusMessage("statusToggleDeleteMissingSelection"));
      return;
    }

    const nextRows = rows.flatMap((row) => {
      if (!targetRowIds.includes(row.meta.rowKey)) {
        return row;
      }

      const toggledRow = toggleRowDeleted(row);
      return toggledRow ? [toggledRow] : [];
    });

    setEditSession(null);
    commitRows(nextRows);
    setStatusMessage(
      getStatusMessage("statusToggleDeleteSuccess", {
        rowCount: targetRowIds.length,
      }),
    );
  }

  function handleDeleteCheckToggle(rowKey: string) {
    const nextRows = rows.flatMap((row) => {
      if (row.meta.rowKey !== rowKey) {
        return row;
      }

      const toggledRow = toggleRowDeleted(row);
      return toggledRow ? [toggledRow] : [];
    });

    setEditSession(null);
    commitRows(nextRows);
    setStatusMessage(
      getStatusMessage("statusToggleDeleteSuccess", {
        rowCount: 1,
      }),
    );
  }

  function handleSave() {
    if (hasValidationIssues(rows)) {
      setStatusMessage(getStatusMessage("statusSaveBlockedValidation"));
      return;
    }

    const bundle = buildSaveBundle(rows);
    const nextRows = markRowsSaved(rows);

    setLastSaveBundle(bundle);
    setEditSession(null);
    commitRows(nextRows, createDefaultSelection(nextRows));
    setStatusMessage(
      getStatusMessage("statusSaveSummary", {
        insertedCount: bundle.inserted.length,
        updatedCount: bundle.updated.length,
        deletedCount: bundle.deleted.length,
      }),
    );
    emitGridAfterSave(publicEvents, {
      gridId: "grid-lab",
      bundle,
    });
  }

  function handleFieldChange<Field extends keyof PlaygroundRow>(
    field: Field,
    value: PlaygroundRow[Field],
  ) {
    if (!activeRow) {
      return;
    }

    const column = playgroundColumns.find((item) => item.key === field);
    if (column && !isGridCellEditable(column.editable, activeRow.row)) {
      return;
    }

    const nextRows = rows.map((row) =>
      row.meta.rowKey === activeRow.meta.rowKey
        ? applyRowPatch(row, { [field]: value } as Pick<PlaygroundRow, Field>)
        : row,
    );

    commitRows(nextRows);
  }

  function handleCellEditCommit(input: {
    rowKey: string;
    columnKey: string;
    draftValue: string;
  }) {
    const column = playgroundColumns.find((item) => item.key === input.columnKey);
    if (!column) {
      setEditSession(null);
      return;
    }

    const nextRows = rows.map((row) => {
      if (row.meta.rowKey !== input.rowKey) {
        return row;
      }

      const parsedValue = column.parse
        ? column.parse(input.draftValue, row.row)
        : input.draftValue;

      return applyRowPatch(
        row,
        { [input.columnKey]: parsedValue } as Partial<PlaygroundRow>,
        "edit",
      );
    });

    setEditSession(clearEditSession());
    commitRows(nextRows);
  }

  async function handleSearch() {
    await loadRows(
      {
        ...query,
        pageIndex: 0,
        filters: createFilters(filterDraft),
      },
      "조건 조회",
    );
  }

  async function handleFiltersChange(nextFilters: GridFilter[]) {
    await loadRows(
      {
        ...query,
        pageIndex: 0,
        filters: nextFilters,
      },
      nextFilters.length > 0 ? "그리드 필터 적용" : "그리드 필터 초기화",
    );
  }

  async function handleExportExcel() {
    const buffer = await exportRowsToExcelBufferLazy({
      sheetName: "VibeGridRows",
      columns: playgroundColumns,
      rows: rows.map((row) => row.row),
    });

    triggerDownload("vibe-grid-rows.xlsx", buffer as ArrayBuffer);
    setStatusMessage(getStatusMessage("statusExportExcelSuccess"));
  }

  async function handleDownloadTemplate() {
    const buffer = await createExcelTemplateBufferLazy({
      sheetName: "VibeGridTemplate",
      columns: playgroundColumns,
      sampleRows: [createBlankRow(1)],
    });

    triggerDownload("vibe-grid-template.xlsx", buffer as ArrayBuffer);
    setStatusMessage(getStatusMessage("statusDownloadTemplateSuccess"));
  }

  function handleImportExcel() {
    const input = document.getElementById(importInputId);
    if (input instanceof HTMLInputElement) {
      input.click();
    }
  }

  async function handleReadClipboard() {
    try {
      const nextText = await navigator.clipboard.readText();
      setPasteText(nextText);
      setStatusMessage(getStatusMessage("statusClipboardReadSuccess"));
    } catch {
      setStatusMessage(getStatusMessage("statusClipboardReadDenied"));
    }
  }

  async function handleExcelFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const buffer = await file.arrayBuffer();
    const preview = await importExcelPreviewLazy<PlaygroundRow>({
      buffer,
      columns: playgroundColumns,
    });

    setImportPreview(preview);
    setPasteText(preview.text);
    setStatusMessage(
      preview.ok
        ? getStatusMessage("statusImportPreviewSuccess", {
            rowCount: preview.rows.length,
          })
        : getStatusMessage("statusImportPreviewHeaderMismatch", {
            missingHeaders: preview.missingHeaders.join(", ") || "-",
            unknownHeaders: preview.unknownHeaders.join(", ") || "-",
          }),
    );

    event.target.value = "";
  }

  function handleApplyPaste() {
    applyTabularText(pasteText, "붙여넣기");
  }

  function handleGridClipboardPaste({
    text,
    anchorCell,
    visibleColumnKeys,
  }: GridClipboardPasteInput) {
    setPasteText(text);
    applyTabularText(text, "그리드 직접 붙여넣기", {
      anchorCell,
      visibleColumnKeys,
    });
  }

  function handleApplyImportPreview() {
    if (!importPreview) {
      return;
    }

    if (!importPreview.ok) {
      setStatusMessage(getStatusMessage("statusImportApplyBlockedHeader"));
      return;
    }

    applyTabularText(importPreview.text, "엑셀 업로드");
    setImportPreview(null);
  }

  async function handlePageMove(nextPageIndex: number) {
    await loadRows(
      {
        ...query,
        pageIndex: Math.max(0, Math.min(pageSnapshot.pageCount - 1, nextPageIndex)),
      },
      "페이지 이동",
    );
  }

  async function handlePageSizeChange(pageSize: number) {
    await loadRows(
      {
        ...query,
        pageIndex: 0,
        pageSize,
      },
      "페이지 크기 변경",
    );
  }

  async function handleSortingChange(nextSorting: GridQuery["sorting"]) {
    await loadRows(
      {
        ...query,
        pageIndex: 0,
        sorting: nextSorting,
      },
      "서버 정렬 변경",
    );
  }

  const commandHandlers: Partial<
    Record<(typeof commands)[number]["id"], () => void | Promise<void>>
  > = {
    search: handleSearch,
    insert: handleInsert,
    copyRow: handleCopyRow,
    toggleDelete: handleToggleDelete,
    save: handleSave,
    exportExcel: handleExportExcel,
    downloadTemplate: handleDownloadTemplate,
    importExcel: handleImportExcel,
  };

  return (
    <section style={{ display: "grid", gap: 24 }}>
      <input
        id={importInputId}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleExcelFileChange}
        style={{ display: "none" }}
      />

      <section style={heroSectionStyle}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={heroChipStyle("rgba(255,255,255,0.12)")}>Grid Lab</span>
          <span style={heroChipStyle("rgba(16,185,129,0.18)")}>Server Query</span>
          <span style={heroChipStyle("rgba(56,189,248,0.18)")}>Column State</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.1 }}>
          업무형 Grid 제품 실험실
        </h1>
        <p style={heroDescriptionStyle}>
          조회, 입력, 복사, 삭제 토글, 엑셀, 붙여넣기뿐 아니라 컬럼 보이기/숨기기,
          순서 이동, 폭 조절, pinning, server filter/sort/page까지 한 화면에서 같이
          검증합니다.
        </p>
      </section>

      <section style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {commands.map((command) => {
          const action = commandHandlers[command.id as keyof typeof commandHandlers];

          return (
            <button
              key={command.id}
              type="button"
              data-testid={`command-${command.id}`}
              disabled={!action}
              onClick={() => action?.()}
              style={action ? primaryGhostButtonStyle : disabledButtonStyle}
            >
              {command.label}
            </button>
          );
        })}
      </section>

      <section style={statusPanelStyle} data-testid="status-panel">
        {statusMessage}
      </section>

      <section style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 18 }}>
          <section style={cardStyle}>
            <div style={metricGridStyle}>
              <MetricCard label="현재 페이지" value={`${rows.length}행`} tone="teal" />
              <MetricCard
                label="전체 건수"
                value={`${pageSnapshot.totalCount}건`}
                tone="blue"
              />
              <MetricCard
                label="행 상태"
                value={`N ${stateCounts.N} / I ${stateCounts.I} / U ${stateCounts.U} / D ${stateCounts.D}`}
                tone="slate"
              />
              <MetricCard
                label="검증 이슈"
                value={`${validationIssueCount}건`}
                tone={validationIssueCount > 0 ? "amber" : "teal"}
              />
              <MetricCard
                label="서버 쿼리"
                value={`필터 ${query.filters.length} / 정렬 ${query.sorting.length}`}
                tone="slate"
              />
              <MetricCard
                label="로딩 상태"
                value={isFetching ? "조회 중" : "준비됨"}
                tone={isFetching ? "amber" : "teal"}
              />
              <MetricCard
                label="편집 진입"
                value={editActivation === "singleClick" ? "single click" : "double click"}
                tone="slate"
              />
              <MetricCard
                label="밀도"
                value={`${density} / ${densityMetrics.rowHeight}px`}
                tone="slate"
              />
            </div>
          </section>

          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <strong style={{ fontSize: 18, color: "#0f172a" }}>
                  편집 진입 모드
                </strong>
                <div style={{ marginTop: 6, color: "#64748b" }}>
                  기본은 double click이고, single click은 편집 중심 화면에서만 opt-in 합니다.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select
                  data-testid="grid-density-mode"
                  value={density}
                  onChange={(event) => setDensity(event.target.value as GridDensity)}
                  style={compactInputStyle}
                >
                  <option value="compact">compact (36px)</option>
                  <option value="default">default (42px)</option>
                  <option value="comfortable">comfortable (52px)</option>
                </select>
                <select
                  data-testid="edit-activation-mode"
                  value={editActivation}
                  onChange={(event) =>
                    setEditActivation(event.target.value as GridEditActivation)
                  }
                  style={compactInputStyle}
                >
                  <option value="doubleClick">doubleClick</option>
                  <option value="singleClick">singleClick</option>
                </select>
              </div>
            </div>
          </section>

          <VibeGrid
            gridId="playground-grid"
            rows={rows}
            columns={playgroundColumns}
            selectionState={selectionState}
            onSelectionStateChange={setSelectionState}
            editSession={editSession}
            onEditSessionChange={setEditSession}
            onCellEditCommit={handleCellEditCommit}
            publicEvents={publicEvents}
            onClipboardPaste={handleGridClipboardPaste}
            onDeleteCheckToggle={handleDeleteCheckToggle}
            enableRowCheck
            editActivation={editActivation}
            density={density}
            columnState={columnState}
            onColumnStateChange={setColumnState}
            sorting={query.sorting}
            onSortingChange={handleSortingChange}
            filters={query.filters}
            onFiltersChange={handleFiltersChange}
            enableFilterRow
            height={620}
          />

          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <strong style={{ fontSize: 18, color: "#0f172a" }}>
                  서버 페이지네이션
                </strong>
                <div style={{ marginTop: 6, color: "#64748b" }}>
                  {pageSnapshot.pageIndex + 1} / {pageSnapshot.pageCount} 페이지
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select
                  value={pageSnapshot.pageSize}
                  onChange={(event) =>
                    void handlePageSizeChange(Number(event.target.value))
                  }
                  style={compactInputStyle}
                >
                  {[10, 12, 20, 30].map((size) => (
                    <option key={size} value={size}>
                      {size}행
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handlePageMove(pageSnapshot.pageIndex - 1)}
                  disabled={pageSnapshot.pageIndex === 0 || isFetching}
                  style={secondaryButtonStyle}
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={() => void handlePageMove(pageSnapshot.pageIndex + 1)}
                  disabled={
                    pageSnapshot.pageIndex >= pageSnapshot.pageCount - 1 || isFetching
                  }
                  style={secondaryButtonStyle}
                >
                  다음
                </button>
              </div>
            </div>
          </section>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>서버 Query / Filter / Sort / Page</h2>
              <span style={badgeStyle("#e0f2fe", "#0369a1")}>실동작</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {activeFiltersSummary.length === 0 ? (
                <span style={badgeStyle("#f8fafc", "#475569")}>활성 필터 없음</span>
              ) : (
                activeFiltersSummary.map((filter) => (
                  <span key={filter.key} style={badgeStyle("#ecfeff", "#0f766e")}>
                    {filter.label}
                  </span>
                ))
              )}
            </div>
            <label style={fieldLabelStyle}>
              키워드
              <input
                data-testid="filter-keyword"
                value={filterDraft.keyword}
                onChange={(event) =>
                  setFilterDraft((previous) => ({
                    ...previous,
                    keyword: event.target.value,
                  }))
                }
                placeholder="샘플코드/샘플명/부서/비고"
                style={fullInputStyle}
              />
            </label>
            <label style={fieldLabelStyle}>
              사용여부
              <select
                data-testid="filter-useYn"
                value={filterDraft.useYn}
                onChange={(event) =>
                  setFilterDraft((previous) => ({
                    ...previous,
                    useYn: event.target.value as FilterDraft["useYn"],
                  }))
                }
                style={fullInputStyle}
              >
                <option value="">전체</option>
                {useYnOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                data-testid="server-search"
                onClick={() => void handleSearch()}
                disabled={isFetching}
                style={primaryButtonStyle}
              >
                서버 조회
              </button>
              <button
                type="button"
                data-testid="server-reset"
                onClick={() => {
                  setFilterDraft({ keyword: "", useYn: "" });
                  void loadRows(defaultGridQuery, "조건 초기화");
                }}
                style={secondaryButtonStyle}
              >
                조건 초기화
              </button>
            </div>
            <pre data-testid="query-preview" style={preStyle}>
              {prettyQuery}
            </pre>
          </section>

          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>컬럼 기능 4종</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={badgeStyle("#ecfeff", "#0f766e")}>Visibility</span>
                <span style={badgeStyle("#eff6ff", "#1d4ed8")}>Sizing</span>
                <span style={badgeStyle("#fff7ed", "#c2410c")}>Ordering</span>
                <span style={badgeStyle("#f5f3ff", "#6d28d9")}>Pinning</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setColumnState(createGridColumnState(playgroundColumns))}
                style={secondaryButtonStyle}
              >
                컬럼 초기화
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {playgroundColumns.map((column) => {
                const pinValue = columnState.pinning.left.includes(column.key)
                  ? "left"
                  : columnState.pinning.right.includes(column.key)
                    ? "right"
                    : "none";

                return (
                  <div
                    key={column.key}
                    style={{
                      display: "grid",
                      gap: 10,
                      borderRadius: 18,
                      border: "1px solid #e2e8f0",
                      padding: 14,
                      background: "#f8fafc",
                    }}
                  >
                    <div style={sectionHeaderStyle}>
                      <strong style={{ color: "#0f172a" }}>{column.header}</strong>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "#334155",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={columnState.visibility[column.key] !== false}
                          onChange={(event) =>
                            setColumnState((previous) =>
                              setGridColumnVisibility(
                                previous,
                                column.key,
                                event.target.checked,
                              ),
                            )
                          }
                        />
                        보이기
                      </label>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setColumnState((previous) =>
                            moveGridColumn(previous, column.key, "left"),
                          )
                        }
                        style={secondaryButtonStyle}
                      >
                        왼쪽 이동
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setColumnState((previous) =>
                            moveGridColumn(previous, column.key, "right"),
                          )
                        }
                        style={secondaryButtonStyle}
                      >
                        오른쪽 이동
                      </button>
                      <select
                        value={pinValue}
                        onChange={(event) =>
                          setColumnState((previous) =>
                            setGridColumnPinning(
                              previous,
                              column.key,
                              event.target.value === "none"
                                ? false
                                : (event.target.value as "left" | "right"),
                            ),
                          )
                        }
                        style={compactInputStyle}
                      >
                        <option value="none">고정 없음</option>
                        <option value="left">왼쪽 고정</option>
                        <option value="right">오른쪽 고정</option>
                      </select>
                    </div>

                    <label style={fieldLabelStyle}>
                      폭
                      <input
                        type="range"
                        min={80}
                        max={420}
                        value={columnState.sizing[column.key] ?? column.width ?? 140}
                        onChange={(event) =>
                          setColumnState((previous) =>
                            setGridColumnWidth(
                              previous,
                              column.key,
                              Number(event.target.value),
                            ),
                          )
                        }
                      />
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        {columnState.sizing[column.key] ?? column.width ?? 140}px
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>선택 행 편집기</h2>
              <span style={badgeStyle("#ecfdf5", "#047857")}>Editor Set 준비</span>
            </div>
            {!activeRow ? (
              <div style={{ color: "#64748b", lineHeight: 1.7 }}>
                편집할 행을 먼저 선택해 주세요.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {playgroundColumns.map((column) => (
                  <label key={column.key} style={fieldLabelStyle}>
                    {column.header}
                    {renderSideEditor({
                      column,
                      row: activeRow.row,
                      editable: isGridCellEditable(column.editable, activeRow.row),
                      onChange: (rawValue) =>
                        handleFieldChange(
                          column.key as keyof PlaygroundRow,
                          normalizeEditorValue(column, rawValue, activeRow.row),
                        ),
                    })}
                  </label>
                ))}
              </div>
            )}
          </section>

          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>붙여넣기 / 엑셀</h2>
              <span style={badgeStyle("#fef3c7", "#92400e")}>Header Validate</span>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label style={{ ...fieldLabelStyle, minWidth: 280 }}>
                Paste row overflow
                <select
                  data-testid="paste-row-overflow-policy"
                  value={pasteRowOverflowPolicy}
                  onChange={(event) =>
                    setPasteRowOverflowPolicy(
                      event.target.value as ClipboardRowOverflowPolicy,
                    )
                  }
                  style={compactInputStyle}
                >
                  <option value="reject">Reject rows beyond the loaded range</option>
                  <option value="append">Append new rows when overflow happens</option>
                </select>
              </label>
              <button
                type="button"
                data-testid="clipboard-read"
                onClick={() => void handleReadClipboard()}
                style={secondaryButtonStyle}
              >
                클립보드 읽기
              </button>
              <button
                type="button"
                data-testid="paste-apply"
                onClick={handleApplyPaste}
                style={primaryButtonStyle}
              >
                붙여넣기 적용
              </button>
              <button
                type="button"
                onClick={handleApplyImportPreview}
                disabled={!importPreview}
                style={secondaryButtonStyle}
              >
                업로드 적용
              </button>
            </div>

            <textarea
              data-testid="paste-textarea"
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
              rows={8}
              placeholder="엑셀이나 웹에서 복사한 TSV 데이터를 붙여넣어 주세요."
              style={{
                width: "100%",
                border: "1px solid #cbd5e1",
                borderRadius: 16,
                padding: "12px 14px",
                resize: "vertical",
                font: "inherit",
                lineHeight: 1.6,
              }}
            />

            {importPreview ? (
              <div
                style={{
                  borderRadius: 16,
                  padding: 14,
                  background: importPreview.ok ? "#ecfdf5" : "#fef2f2",
                  color: importPreview.ok ? "#065f46" : "#991b1b",
                  lineHeight: 1.7,
                }}
              >
                <div>헤더: {importPreview.headers.join(", ") || "-"}</div>
                <div>누락 헤더: {importPreview.missingHeaders.join(", ") || "-"}</div>
                <div>
                  알 수 없는 헤더: {importPreview.unknownHeaders.join(", ") || "-"}
                </div>
                <div>미리보기 행수: {importPreview.rows.length}</div>
              </div>
            ) : null}
          </section>

          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>선택 / 붙여넣기 상태</h2>
              <span style={badgeStyle("#ecfeff", "#0f766e")}>Range + Paste</span>
            </div>

            <div
              data-testid="range-summary"
              style={{
                borderRadius: 16,
                border: "1px solid #dbeafe",
                background: "#f8fbff",
                padding: 14,
                color: "#0f172a",
                lineHeight: 1.7,
              }}
            >
              {rangeSummary ? (
                <>
                  <div>
                    크기: {rangeSummary.rows} x {rangeSummary.columns}
                  </div>
                  <div>
                    anchor: {rangeSummary.anchor.rowKey} / {rangeSummary.anchor.columnKey}
                  </div>
                  <div>
                    focus: {rangeSummary.focus.rowKey} / {rangeSummary.focus.columnKey}
                  </div>
                </>
              ) : (
                <div>현재 활성 range가 없습니다.</div>
              )}
            </div>

            <div
              data-testid="paste-summary"
              style={{
                marginTop: 14,
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                background: "#fff",
                padding: 14,
                color: "#334155",
                lineHeight: 1.7,
              }}
            >
              {pasteSummary ? (
                <>
                  <div data-testid="paste-summary-source">
                    source: {pasteSummary.sourceLabel}
                  </div>
                  <div data-testid="paste-summary-matrix">
                    matrix: {pasteSummary.summary.matrixRowCount} x{" "}
                    {pasteSummary.summary.matrixColumnCount}
                  </div>
                  <div data-testid="paste-summary-policy">
                    row overflow policy: {pasteSummary.summary.rowOverflowPolicy}
                  </div>
                  <div data-testid="paste-summary-applied">
                    applied: {pasteSummary.summary.appliedCellCount}
                  </div>
                  <div data-testid="paste-summary-appended">
                    appended rows: {pasteSummary.summary.appendedRowCount}
                  </div>
                  <div data-testid="paste-summary-row-overflow">
                    row overflow cells: {pasteSummary.summary.rowOverflowCellCount}
                  </div>
                  <div data-testid="paste-summary-validation">
                    validation errors: {pasteSummary.summary.validationErrorCount}
                  </div>
                  <div data-testid="paste-summary-skipped-total">
                    skipped total: {pasteSummary.summary.skippedCellCount}
                  </div>
                  <div>
                    skipped:{" "}
                    {clipboardSkipReasonOrder
                      .filter((reason) => pasteSummary.summary.skippedCounts[reason] > 0)
                      .map(
                        (reason) =>
                          `${pasteSkipReasonLabels[reason]} ${pasteSummary.summary.skippedCounts[reason]}`,
                      )
                      .join(", ") || "none"}
                  </div>
                  {clipboardSkipReasonOrder.map((reason) => (
                    <div
                      key={reason}
                      data-testid={`paste-summary-skipped-${reason}`}
                    >
                      {pasteSkipReasonLabels[reason]}:{" "}
                      {pasteSummary.summary.skippedCounts[reason]}
                    </div>
                  ))}
                  {pasteSummary.summary.firstSkippedCell ? (
                    <div data-testid="paste-summary-first-skipped" style={{ marginTop: 8 }}>
                      first skipped: {pasteSummary.summary.firstSkippedCell.reason}
                      {pasteSummary.summary.firstSkippedCell.columnKey
                        ? ` / ${pasteSummary.summary.firstSkippedCell.columnKey}`
                        : ""}
                      {pasteSummary.summary.firstSkippedCell.rowKey
                        ? ` / ${pasteSummary.summary.firstSkippedCell.rowKey}`
                        : ""}
                    </div>
                  ) : null}
                  {pasteSummary.summary.firstValidationError ? (
                    <div data-testid="paste-summary-first-validation" style={{ marginTop: 8 }}>
                      first error: {pasteSummary.summary.firstValidationError.columnKey} /{" "}
                      {pasteSummary.summary.firstValidationError.messages.join("; ")}
                    </div>
                  ) : null}
                </>
              ) : (
                <div>아직 paste 결과가 없습니다.</div>
              )}
            </div>
          </section>

          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>저장 번들 미리보기</h2>
              <span style={badgeStyle("#e2e8f0", "#334155")}>Diff Bundle</span>
            </div>
            <pre style={preStyle} data-testid="save-bundle-preview">
              {lastSaveBundle ? prettySaveBundle : "아직 저장 번들이 생성되지 않았습니다."}
            </pre>
          </section>
          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Public Event Log</h2>
              <span style={badgeStyle("#e0f2fe", "#0f4c81")}>Experimental</span>
            </div>
            <div data-testid="public-event-log" style={{ display: "grid", gap: 8 }}>
              {publicEventLog.length > 0 ? (
                publicEventLog.map((entry, index) => (
                  <div
                    key={entry.id}
                    data-testid={`public-event-log-item-${index}`}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(148, 163, 184, 0.18)",
                      background: "rgba(255, 255, 255, 0.7)",
                      padding: "10px 12px",
                      color: "#334155",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {entry.label}
                  </div>
                ))
              ) : (
                <div>아직 발생한 public event가 없습니다.</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}

function renderSideEditor(input: {
  column: (typeof playgroundColumns)[number];
  row: PlaygroundRow;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  const { column, row, editable, onChange } = input;
  const rawValue = row[column.key as keyof PlaygroundRow];
  const displayValue = String(rawValue ?? "");
  const editor = column.editor ?? { type: "text" as const };
  const sharedStyle = editable
    ? fullInputStyle
    : {
        ...fullInputStyle,
        opacity: 0.6,
        background: "#f8fafc",
        cursor: "not-allowed",
      };

  if (editor.type === "select") {
    const options =
      typeof editor.options === "function" ? editor.options(row) : editor.options;

    return (
      <select
        data-testid={`side-editor-${column.key}`}
        disabled={!editable}
        value={displayValue}
        onChange={(event) => onChange(event.target.value)}
        style={sharedStyle}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (editor.type === "textarea") {
    return (
      <textarea
        data-testid={`side-editor-${column.key}`}
        disabled={!editable}
        value={displayValue}
        rows={editor.rows ?? 4}
        placeholder={editor.placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{
          ...sharedStyle,
          resize: "vertical",
          minHeight: 96,
        }}
      />
    );
  }

  if (editor.type === "number") {
    return (
      <input
        data-testid={`side-editor-${column.key}`}
        type="number"
        disabled={!editable}
        min={editor.min}
        max={editor.max}
        step={editor.step}
        value={displayValue}
        placeholder={editor.placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={sharedStyle}
      />
    );
  }

  if (editor.type === "date") {
    return (
      <input
        data-testid={`side-editor-${column.key}`}
        type="date"
        disabled={!editable}
        min={editor.minDate}
        max={editor.maxDate}
        value={displayValue}
        onChange={(event) => onChange(event.target.value)}
        style={sharedStyle}
      />
    );
  }

  return (
    <input
      data-testid={`side-editor-${column.key}`}
      disabled={!editable}
      value={displayValue}
      placeholder={editor.placeholder}
      onChange={(event) => onChange(event.target.value)}
      style={sharedStyle}
    />
  );
}

function normalizeEditorValue(
  column: (typeof playgroundColumns)[number],
  rawValue: string,
  row: PlaygroundRow,
) {
  return column.parse
    ? (column.parse(rawValue, row) as PlaygroundRow[keyof PlaygroundRow])
    : (rawValue as PlaygroundRow[keyof PlaygroundRow]);
}

function MetricCard(input: {
  label: string;
  value: string;
  tone: "teal" | "blue" | "amber" | "slate";
}) {
  const palette = {
    teal: { color: "#0f766e", borderColor: "#e5e5e5" },
    blue: { color: "#1d4ed8", borderColor: "#e5e5e5" },
    amber: { color: "#c2410c", borderColor: "#e5e5e5" },
    slate: { color: "#334155", borderColor: "#e5e5e5" },
  }[input.tone];

  return (
    <article
      style={{
        borderRadius: 8,
        padding: 16,
        border: `1px solid ${palette.borderColor}`,
        background: "#ffffff",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, color: palette.color }}>{input.label}</div>
      <div style={{ marginTop: 6, fontSize: 18, fontWeight: 600, color: "#0a0a0a" }}>{input.value}</div>
    </article>
  );
}

const heroSectionStyle = {
  borderRadius: 12,
  padding: "48px",
  background: "linear-gradient(135deg, #f0f9ff, #e0f2fe 50%, #bae6fd)",
  color: "#0c4a6e",
} as const;

const heroDescriptionStyle = {
  marginTop: 20,
  maxWidth: 920,
  lineHeight: 1.6,
  fontSize: 15,
  color: "#475569",
} as const;

const heroChipStyle = (background: string) =>
  ({
    padding: "4px 10px",
    borderRadius: 9999,
    border: "1px solid rgba(14, 165, 233, 0.2)",
    background,
    fontSize: 12,
    fontWeight: 500,
    color: "#0369a1",
  }) as const;

const statusPanelStyle = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  background: "#ffffff",
  padding: 16,
  color: "#334155",
  lineHeight: 1.5,
  fontSize: 14,
  fontWeight: 500,
} as const;


const cardStyle = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 24,
  background: "#ffffff",
} as const;

const metricGridStyle = {
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
} as const;

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 16,
} as const;

const sectionTitleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: "#0a0a0a",
} as const;

const badgeStyle = (background: string, color: string) =>
  ({
    borderRadius: 9999,
    padding: "2px 8px",
    background,
    color,
    fontSize: 12,
    fontWeight: 500,
    border: `1px solid ${color}20`,
  }) as const;

const fieldLabelStyle = {
  display: "grid",
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
  color: "#334155",
} as const;

const fullInputStyle = {
  width: "100%",
  border: "1px solid #e5e5e5",
  borderRadius: 6,
  padding: "8px 12px",
  font: "inherit",
  fontSize: 14,
  background: "#ffffff",
} as const;

const compactInputStyle = {
  border: "1px solid #e5e5e5",
  borderRadius: 6,
  padding: "8px 12px",
  font: "inherit",
  fontSize: 14,
  background: "#ffffff",
} as const;

const primaryButtonStyle = {
  border: "1px solid #0f766e",
  borderRadius: 6,
  padding: "8px 16px",
  background: "#0f766e",
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
} as const;

const secondaryButtonStyle = {
  border: "1px solid #e5e5e5",
  borderRadius: 6,
  padding: "8px 16px",
  background: "#ffffff",
  color: "#0a0a0a",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
} as const;

const primaryGhostButtonStyle = {
  border: "1px solid #e5e5e5",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0a0a0a",
  padding: "8px 16px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
} as const;

const disabledButtonStyle = {
  ...primaryGhostButtonStyle,
  background: "#f5f5f5",
  color: "#a3a3a3",
  cursor: "not-allowed",
} as const;

const preStyle = {
  margin: 0,
  padding: 14,
  borderRadius: 6,
  background: "#18181b",
  color: "#d4d4d8",
  fontSize: 13,
  lineHeight: 1.6,
  overflowX: "auto",
  border: "1px solid #e5e5e5",
} as const;
