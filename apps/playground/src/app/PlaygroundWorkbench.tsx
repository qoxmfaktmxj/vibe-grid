"use client";

import {
  startTransition,
  useEffect,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import {
  buildRectangularPastePlan,
  createClipboardSchema,
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
  getPrimarySelectedRowId,
  getRowStateCounts,
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
  type GridColumnState,
  type GridEditSession,
  type GridFilter,
  type GridPageSnapshot,
  type GridQuery,
  type GridSelectionState,
  type GridServerResult,
  type ManagedGridRow,
  type SaveBundle,
} from "@vibe-grid/core";
import { VibeGrid } from "@vibe-grid/react";
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

type FilterDraft = {
  keyword: string;
  useYn: "" | "Y" | "N";
};

const clipboardSchema = createClipboardSchema(playgroundColumns, {
  useYn: (value) => (value.trim().toUpperCase() === "N" ? "N" : "Y"),
  sortOrder: (value) => Number(value.trim() || "0"),
});

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

export function PlaygroundWorkbench() {
  const importInputId = useId();
  const [rows, setRows] = useState(initialRows);
  const [selectionState, setSelectionState] = useState<GridSelectionState>(
    createDefaultSelection(initialRows),
  );
  const [editSession, setEditSession] = useState<GridEditSession | null>(null);
  const [lastSaveBundle, setLastSaveBundle] =
    useState<SaveBundle<PlaygroundRow> | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Grid Lab에서 조회, 입력, 저장, 엑셀, 붙여넣기, 컬럼 상태를 함께 검증할 수 있습니다.",
  );
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

  const commands = createDefaultCommandRegistry("ko-KR");
  const activeRowKey = selectionState.activeRowId;
  const activeRow =
    rows.find((row) => row.meta.rowKey === activeRowKey) ??
    rows.find((row) => row.meta.rowKey === getPrimarySelectedRowId(selectionState));
  const stateCounts = getRowStateCounts(rows);
  const validationIssueCount = countValidationIssues(rows);
  const prettyQuery = useMemo(() => JSON.stringify(query, null, 2), [query]);
  const prettySaveBundle = useMemo(
    () => JSON.stringify(lastSaveBundle, null, 2),
    [lastSaveBundle],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("vibe-grid:playground:columns");
      if (!raw) {
        return;
      }

      setColumnState(
        sanitizeGridColumnState(playgroundColumns, JSON.parse(raw) as GridColumnState),
      );
    } catch {
      // ignore invalid local prefs in the lab
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "vibe-grid:playground:columns",
      JSON.stringify(columnState),
    );
  }, [columnState]);

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
        `${reason}: 서버에서 ${result.rows.length}건을 불러왔습니다. 전체 ${result.totalCount}건, ${result.pageIndex + 1}/${result.pageCount} 페이지입니다.`,
      );
    } catch (error) {
      setStatusMessage(
        `서버 조회에 실패했습니다. ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      );
    } finally {
      setIsFetching(false);
    }
  }

  function applyTabularText(text: string, sourceLabel: string) {
    const plan = buildRectangularPastePlan({
      text,
      columns: clipboardSchema,
      rowOrder: rows.map((row) => row.meta.rowKey),
      anchor: selectionState.activeCell,
      allowAppendRows: true,
    });

    if (plan.appliedCellCount === 0) {
      const firstReason = plan.skippedCells[0]?.reason;
      setStatusMessage(
        firstReason === "missingAnchorColumn"
          ? "먼저 그리드에서 시작 셀을 선택해 주세요."
          : firstReason === "missingAnchorRow"
            ? "선택된 행이 없어 데이터를 적용할 수 없습니다."
            : "적용 가능한 데이터가 없습니다.",
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
      `${sourceLabel}: ${plan.appliedCellCount}개 셀 반영, 신규 ${plan.appendedRows.length}행 추가, 건너뜀 ${plan.skippedCells.length}건`,
    );
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
    setStatusMessage("신규 행을 추가했습니다. 현재 페이지의 로컬 작업 상태입니다.");
  }

  function handleCopyRow() {
    const sourceRowKey = getPrimarySelectedRowId(selectionState);
    const sourceRow = rows.find((row) => row.meta.rowKey === sourceRowKey);

    if (!sourceRow) {
      setStatusMessage("복사할 행을 먼저 선택해 주세요.");
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
    setStatusMessage("선택한 행을 복사했습니다.");
  }

  function handleToggleDelete() {
    const targetRowIds = [...selectionState.selectedRowIds];

    if (targetRowIds.length === 0) {
      setStatusMessage("삭제 토글할 행을 먼저 선택해 주세요.");
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
    setStatusMessage(`${targetRowIds.length}개 행의 삭제 토글 상태를 바꿨습니다.`);
  }

  function handleSave() {
    if (hasValidationIssues(rows)) {
      setStatusMessage("검증 오류가 남아 있어 저장할 수 없습니다.");
      return;
    }

    const bundle = buildSaveBundle(rows);
    const nextRows = markRowsSaved(rows);

    setLastSaveBundle(bundle);
    setEditSession(null);
    commitRows(nextRows, createDefaultSelection(nextRows));
    setStatusMessage(
      `저장 번들을 만들었습니다. 입력 ${bundle.inserted.length}건, 수정 ${bundle.updated.length}건, 삭제 ${bundle.deleted.length}건`,
    );
  }

  function handleFieldChange<Field extends keyof PlaygroundRow>(
    field: Field,
    value: PlaygroundRow[Field],
  ) {
    if (!activeRow) {
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

  async function handleExportExcel() {
    const buffer = await exportRowsToExcelBufferLazy({
      sheetName: "VibeGridRows",
      columns: playgroundColumns,
      rows: rows.map((row) => row.row),
    });

    triggerDownload("vibe-grid-rows.xlsx", buffer as ArrayBuffer);
    setStatusMessage("현재 그리드 데이터를 엑셀로 내보냈습니다.");
  }

  async function handleDownloadTemplate() {
    const buffer = await createExcelTemplateBufferLazy({
      sheetName: "VibeGridTemplate",
      columns: playgroundColumns,
      sampleRows: [createBlankRow(1)],
    });

    triggerDownload("vibe-grid-template.xlsx", buffer as ArrayBuffer);
    setStatusMessage("엑셀 양식을 다운로드했습니다.");
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
      setStatusMessage("클립보드 내용을 가져왔습니다. 적용 버튼으로 반영해 주세요.");
    } catch {
      setStatusMessage(
        "클립보드 권한이 없어 자동으로 읽지 못했습니다. 아래 영역에 직접 붙여넣어 주세요.",
      );
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
        ? `엑셀 미리보기 완료: ${preview.rows.length}행을 읽었습니다.`
        : `엑셀 헤더 불일치: 누락 ${preview.missingHeaders.join(", ") || "-"}, 알 수 없는 헤더 ${preview.unknownHeaders.join(", ") || "-"}`,
    );

    event.target.value = "";
  }

  function handleApplyPaste() {
    applyTabularText(pasteText, "붙여넣기");
  }

  function handleApplyImportPreview() {
    if (!importPreview) {
      return;
    }

    if (!importPreview.ok) {
      setStatusMessage("헤더가 맞지 않아 업로드를 적용할 수 없습니다.");
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
              disabled={!action}
              onClick={() => action?.()}
              style={action ? primaryGhostButtonStyle : disabledButtonStyle}
            >
              {command.label}
            </button>
          );
        })}
      </section>

      <section style={statusPanelStyle}>{statusMessage}</section>

      <section style={layoutGridStyle}>
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
            columnState={columnState}
            onColumnStateChange={setColumnState}
            sorting={query.sorting}
            onSortingChange={handleSortingChange}
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

        <aside style={{ display: "grid", gap: 18 }}>
          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>서버 Query / Filter / Sort / Page</h2>
              <span style={badgeStyle("#e0f2fe", "#0369a1")}>실동작</span>
            </div>
            <label style={fieldLabelStyle}>
              키워드
              <input
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
                onClick={() => void handleSearch()}
                disabled={isFetching}
                style={primaryButtonStyle}
              >
                서버 조회
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterDraft({ keyword: "", useYn: "" });
                  void loadRows(defaultGridQuery, "조건 초기화");
                }}
                style={secondaryButtonStyle}
              >
                조건 초기화
              </button>
            </div>
            <pre style={preStyle}>{prettyQuery}</pre>
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
              <button
                type="button"
                onClick={() => void handleReadClipboard()}
                style={secondaryButtonStyle}
              >
                클립보드 읽기
              </button>
              <button
                type="button"
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
              <h2 style={sectionTitleStyle}>저장 번들 미리보기</h2>
              <span style={badgeStyle("#e2e8f0", "#334155")}>Diff Bundle</span>
            </div>
            <pre style={preStyle}>
              {lastSaveBundle ? prettySaveBundle : "아직 저장 번들이 생성되지 않았습니다."}
            </pre>
          </section>
        </aside>
      </section>
    </section>
  );
}

function renderSideEditor(input: {
  column: (typeof playgroundColumns)[number];
  row: PlaygroundRow;
  onChange: (value: string) => void;
}) {
  const { column, row, onChange } = input;
  const rawValue = row[column.key as keyof PlaygroundRow];
  const displayValue = String(rawValue ?? "");
  const editor = column.editor ?? { type: "text" as const };

  if (editor.type === "select") {
    const options =
      typeof editor.options === "function" ? editor.options(row) : editor.options;

    return (
      <select
        value={displayValue}
        onChange={(event) => onChange(event.target.value)}
        style={fullInputStyle}
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
        value={displayValue}
        rows={editor.rows ?? 4}
        placeholder={editor.placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{
          ...fullInputStyle,
          resize: "vertical",
          minHeight: 96,
        }}
      />
    );
  }

  if (editor.type === "number") {
    return (
      <input
        type="number"
        min={editor.min}
        max={editor.max}
        step={editor.step}
        value={displayValue}
        placeholder={editor.placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={fullInputStyle}
      />
    );
  }

  return (
    <input
      value={displayValue}
      placeholder={editor.placeholder}
      onChange={(event) => onChange(event.target.value)}
      style={fullInputStyle}
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
    teal: { background: "#ecfeff", color: "#0f766e" },
    blue: { background: "#eff6ff", color: "#1d4ed8" },
    amber: { background: "#fff7ed", color: "#c2410c" },
    slate: { background: "#f8fafc", color: "#334155" },
  }[input.tone];

  return (
    <article style={{ borderRadius: 18, padding: 16, ...palette }}>
      <div style={{ fontSize: 12, fontWeight: 800 }}>{input.label}</div>
      <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800 }}>{input.value}</div>
    </article>
  );
}

const heroSectionStyle = {
  border: "1px solid #d9e4f1",
  borderRadius: 28,
  padding: 28,
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,118,110,0.94))",
  color: "#fff",
  boxShadow: "0 20px 60px rgba(15, 23, 42, 0.14)",
} as const;

const heroDescriptionStyle = {
  marginTop: 16,
  maxWidth: 920,
  lineHeight: 1.8,
  color: "rgba(255,255,255,0.82)",
} as const;

const heroChipStyle = (background: string) =>
  ({
    padding: "6px 12px",
    borderRadius: 999,
    background,
    fontSize: 12,
  }) as const;

const statusPanelStyle = {
  border: "1px solid #d9e4f1",
  borderRadius: 22,
  background: "#fff",
  padding: 18,
  color: "#334155",
  lineHeight: 1.7,
} as const;

const layoutGridStyle = {
  display: "grid",
  gap: 20,
  gridTemplateColumns: "minmax(0, 1.75fr) minmax(340px, 0.95fr)",
  alignItems: "start",
} as const;

const cardStyle = {
  border: "1px solid #d9e4f1",
  borderRadius: 24,
  padding: 20,
  background: "#fff",
  boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)",
} as const;

const metricGridStyle = {
  display: "grid",
  gap: 12,
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
  fontSize: 20,
  color: "#0f172a",
} as const;

const badgeStyle = (background: string, color: string) =>
  ({
    borderRadius: 999,
    padding: "6px 10px",
    background,
    color,
    fontSize: 12,
    fontWeight: 800,
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
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "10px 12px",
  font: "inherit",
  background: "#fff",
} as const;

const compactInputStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "10px 12px",
  font: "inherit",
  background: "#fff",
} as const;

const primaryButtonStyle = {
  border: "1px solid #0f766e",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#0f766e",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const secondaryButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const primaryGhostButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  background: "#fff",
  color: "#0f172a",
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const disabledButtonStyle = {
  ...primaryGhostButtonStyle,
  background: "#f8fafc",
  color: "#94a3b8",
  cursor: "not-allowed",
} as const;

const preStyle = {
  margin: 0,
  padding: 14,
  borderRadius: 16,
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: 12,
  lineHeight: 1.7,
  overflowX: "auto",
} as const;
