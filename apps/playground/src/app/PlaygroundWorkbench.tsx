"use client";

import { startTransition, useId, useState } from "react";
import {
  buildRectangularPastePlan,
  createClipboardSchema,
} from "@vibe-grid/clipboard";
import {
  createExcelTemplateBuffer,
  exportRowsToExcelBuffer,
  importExcelPreview,
  type GridExcelImportPreview,
} from "@vibe-grid/excel";
import {
  applyRowPatch,
  beginEditSession,
  buildSaveBundle,
  clearEditSession,
  clearSelection,
  countValidationIssues,
  createDefaultCommandRegistry,
  createInsertedRow,
  createLoadedRow,
  createSelectionState,
  getPrimarySelectedRowId,
  getRowStateCounts,
  hasValidationIssues,
  markRowsSaved,
  pruneSelectionState,
  toggleRowDeleted,
  updateEditSessionDraft,
  validateManagedRows,
  type GridEditSession,
  type GridSelectionState,
  type ManagedGridRow,
  type SaveBundle,
  type VibeGridColumn,
} from "@vibe-grid/core";
import { VibeGrid } from "@vibe-grid/react";

type PlaygroundRow = {
  sampleCode: string;
  sampleName: string;
  department: string;
  jobTitle: string;
  useYn: "Y" | "N";
  sortOrder: number;
  note: string;
};

const firstEditableColumnKey: keyof PlaygroundRow = "sampleCode";

const playgroundColumns: VibeGridColumn<PlaygroundRow>[] = [
  {
    key: "sampleCode",
    header: "샘플코드",
    width: 150,
    editable: true,
    required: true,
    validate: [
      (value) =>
        String(value ?? "").trim().length >= 3
          ? null
          : "샘플코드는 3자 이상이어야 합니다.",
    ],
  },
  {
    key: "sampleName",
    header: "샘플명",
    width: 180,
    editable: true,
    required: true,
  },
  {
    key: "department",
    header: "부서",
    width: 160,
    editable: true,
    required: true,
  },
  {
    key: "jobTitle",
    header: "직급",
    width: 120,
    editable: true,
    required: true,
  },
  {
    key: "useYn",
    header: "사용여부",
    width: 120,
    editable: true,
    required: true,
    parse: (value) => (value.trim().toUpperCase() === "N" ? "N" : "Y"),
    validate: [
      (value) =>
        value === "Y" || value === "N"
          ? null
          : "사용여부는 Y 또는 N이어야 합니다.",
    ],
  },
  {
    key: "sortOrder",
    header: "정렬순서",
    width: 120,
    editable: true,
    required: true,
    parse: (value) => Number(value.trim() || "0"),
    validate: [
      (value) =>
        Number.isFinite(Number(value)) && Number(value) >= 0
          ? null
          : "정렬순서는 0 이상 숫자여야 합니다.",
    ],
  },
  {
    key: "note",
    header: "비고",
    width: 240,
    editable: true,
  },
];

const clipboardSchema = createClipboardSchema(playgroundColumns, {
  useYn: (value) => (value.trim().toUpperCase() === "N" ? "N" : "Y"),
  sortOrder: (value) => Number(value.trim() || "0"),
});

const playgroundSeedRows: PlaygroundRow[] = [
  {
    sampleCode: "HR-001",
    sampleName: "인사기본",
    department: "인사운영팀",
    jobTitle: "매니저",
    useYn: "Y",
    sortOrder: 1,
    note: "기본 인사 마스터 예시",
  },
  {
    sampleCode: "HR-002",
    sampleName: "평가운영",
    department: "평가보상팀",
    jobTitle: "책임",
    useYn: "Y",
    sortOrder: 2,
    note: "평가 데이터 검증용",
  },
  {
    sampleCode: "HR-003",
    sampleName: "급여정산",
    department: "급여팀",
    jobTitle: "선임",
    useYn: "Y",
    sortOrder: 3,
    note: "저장 payload 테스트",
  },
  {
    sampleCode: "HR-004",
    sampleName: "조직개편",
    department: "HRBP",
    jobTitle: "파트장",
    useYn: "N",
    sortOrder: 4,
    note: "삭제 체크 시나리오",
  },
];

function createSeedRows() {
  return validateManagedRows(
    playgroundSeedRows.map((row, index) =>
      createLoadedRow(`row-${index + 1}`, row),
    ),
    playgroundColumns,
  );
}

function createBlankRow(sequence: number): PlaygroundRow {
  return {
    sampleCode: `NEW-${String(sequence).padStart(3, "0")}`,
    sampleName: "신규 항목",
    department: "미정",
    jobTitle: "사원",
    useYn: "Y",
    sortOrder: sequence,
    note: "입력 후 저장 전 상태",
  };
}

function createDefaultSelection(
  rows: ManagedGridRow<PlaygroundRow>[],
): GridSelectionState {
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

const initialRows = createSeedRows();

export function PlaygroundWorkbench() {
  const importInputId = useId();
  const [rows, setRows] = useState<ManagedGridRow<PlaygroundRow>[]>(initialRows);
  const [selectionState, setSelectionState] = useState<GridSelectionState>(
    createDefaultSelection(initialRows),
  );
  const [editSession, setEditSession] = useState<GridEditSession | null>(null);
  const [lastSaveBundle, setLastSaveBundle] =
    useState<SaveBundle<PlaygroundRow> | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "그리드에서 시작 셀을 선택한 뒤, 붙여넣기나 엑셀 업로드를 시험해 보세요.",
  );
  const [importPreview, setImportPreview] =
    useState<GridExcelImportPreview<PlaygroundRow> | null>(null);

  const commands = createDefaultCommandRegistry("ko-KR");
  const activeRowKey = selectionState.activeRowId;
  const activeRow =
    rows.find((row) => row.meta.rowKey === activeRowKey) ??
    rows.find((row) => row.meta.rowKey === getPrimarySelectedRowId(selectionState));
  const stateCounts = getRowStateCounts(rows);
  const validationIssueCount = countValidationIssues(rows);

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
      const message =
        firstReason === "missingAnchorColumn"
          ? "먼저 그리드에서 시작 셀을 선택해 주세요."
          : firstReason === "missingAnchorRow"
            ? "선택된 행이 없어서 데이터를 적용할 수 없습니다."
            : firstReason === "emptyMatrix"
              ? "적용할 데이터가 비어 있습니다."
              : "적용 가능한 데이터가 없습니다.";

      setStatusMessage(message);
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
    const mergedRows = [...nextRows, ...appendedRows];

    commitRows(mergedRows);
    setStatusMessage(
      `${sourceLabel}: ${plan.appliedCellCount}개 셀 반영, 신규 ${plan.appendedRows.length}행 추가, 건너뜀 ${plan.skippedCells.length}건`,
    );
  }

  function handleSearch() {
    const nextRows = createSeedRows();
    setLastSaveBundle(null);
    setImportPreview(null);
    setEditSession(null);
    commitRows(nextRows, createDefaultSelection(nextRows));
    setStatusMessage("샘플 데이터로 초기화했습니다.");
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
  }

  function handleCopyRow() {
    const sourceRowKey = getPrimarySelectedRowId(selectionState);
    const sourceRow = rows.find((row) => row.meta.rowKey === sourceRowKey);

    if (!sourceRow) {
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
  }

  function handleToggleDelete() {
    const targetRowIds = [...selectionState.selectedRowIds];

    if (targetRowIds.length === 0) {
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
      `저장 번들을 생성했습니다. 입력 ${bundle.inserted.length}건, 수정 ${bundle.updated.length}건, 삭제 ${bundle.deleted.length}건`,
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

  async function handleExportExcel() {
    const buffer = await exportRowsToExcelBuffer({
      sheetName: "VibeGridRows",
      columns: playgroundColumns,
      rows: rows.map((row) => row.row),
    });

    triggerDownload("vibe-grid-rows.xlsx", buffer as ArrayBuffer);
    setStatusMessage("현재 그리드 데이터를 엑셀로 내보냈습니다.");
  }

  async function handleDownloadTemplate() {
    const buffer = await createExcelTemplateBuffer({
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
      setStatusMessage("클립보드 내용을 불러왔습니다. 적용 버튼으로 반영하세요.");
    } catch {
      setStatusMessage(
        "브라우저 클립보드 권한이 없어서 자동으로 읽지 못했습니다. 아래 영역에 직접 붙여넣어 주세요.",
      );
    }
  }

  async function handleExcelFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const buffer = await file.arrayBuffer();
    const preview = await importExcelPreview<PlaygroundRow>({
      buffer,
      columns: playgroundColumns,
    });

    setImportPreview(preview);
    setPasteText(preview.text);
    setStatusMessage(
      preview.ok
        ? `엑셀 미리보기 완료: ${preview.rows.length}행을 읽었습니다.`
        : `엑셀 헤더 불일치: 누락 ${preview.missingHeaders.join(", ") || "-"}, 알 수 없음 ${preview.unknownHeaders.join(", ") || "-"}`,
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

      <section
        style={{
          border: "1px solid #d9e4f1",
          borderRadius: 28,
          padding: 28,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,118,110,0.94))",
          color: "#fff",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.14)",
        }}
      >
        <div
          style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}
        >
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              fontSize: 12,
            }}
          >
            Playground
          </span>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(16,185,129,0.18)",
              fontSize: 12,
            }}
          >
            Validation + Excel
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.1 }}>
          VibeGrid 업무형 그리드 랩
        </h1>
        <p
          style={{
            marginTop: 16,
            maxWidth: 860,
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.82)",
          }}
        >
          행 선택, active cell 앵커, inline edit session, 검증 오류, 엑셀
          import/export, 붙여넣기, diff 저장 payload를 한 화면에서 검증합니다.
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
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                background: action ? "#fff" : "#f8fafc",
                color: action ? "#0f172a" : "#94a3b8",
                padding: "12px 16px",
                fontWeight: 700,
                cursor: action ? "pointer" : "not-allowed",
              }}
            >
              {command.label}
            </button>
          );
        })}
      </section>

      <section
        style={{
          border: "1px solid #d9e4f1",
          borderRadius: 22,
          background: "#fff",
          padding: 18,
          color: "#334155",
          lineHeight: 1.7,
        }}
      >
        {statusMessage}
      </section>

      <section
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "minmax(0, 1.85fr) minmax(360px, 1fr)",
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            }}
          >
            {[
              { label: "정상", value: stateCounts.N, tone: "#dbeafe", color: "#1d4ed8" },
              { label: "입력", value: stateCounts.I, tone: "#dcfce7", color: "#047857" },
              { label: "수정", value: stateCounts.U, tone: "#ffedd5", color: "#c2410c" },
              { label: "삭제", value: stateCounts.D, tone: "#fee2e2", color: "#b91c1c" },
              {
                label: "검증 오류",
                value: validationIssueCount,
                tone: "#fef3c7",
                color: "#b45309",
              },
            ].map((item) => (
              <article
                key={item.label}
                style={{
                  border: "1px solid #d9e4f1",
                  borderRadius: 20,
                  padding: 18,
                  background: "#fff",
                }}
              >
                <div style={{ color: "#64748b", fontSize: 13 }}>{item.label}</div>
                <strong
                  style={{
                    display: "inline-flex",
                    marginTop: 10,
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: item.tone,
                    color: item.color,
                    fontSize: 20,
                  }}
                >
                  {item.value}
                </strong>
              </article>
            ))}
          </div>

          <VibeGrid
            gridId="playground-business-grid"
            rows={rows}
            columns={playgroundColumns}
            selectionState={selectionState}
            onSelectionStateChange={setSelectionState}
            editSession={editSession}
            onEditSessionChange={setEditSession}
            onCellEditCommit={handleCellEditCommit}
          />
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>선택 컨텍스트</h2>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              <ContextRow label="활성 행" value={selectionState.activeRowId ?? "-"} />
              <ContextRow
                label="선택 행 목록"
                value={[...selectionState.selectedRowIds].join(", ") || "-"}
              />
              <ContextRow
                label="붙여넣기 앵커"
                value={
                  selectionState.activeCell
                    ? `${selectionState.activeCell.rowKey} / ${selectionState.activeCell.columnKey}`
                    : "-"
                }
              />
              <ContextRow
                label="편집 세션"
                value={
                  editSession
                    ? `${editSession.rowKey} / ${editSession.columnKey}`
                    : "-"
                }
              />
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>선택 행 편집</h2>
            <p style={sectionBodyStyle}>
              우측 폼 편집과 그리드 더블클릭 편집이 같은 row-state/validation 규칙을
              사용합니다.
            </p>

            {!activeRow ? (
              <div style={emptyCardStyle}>선택된 행이 없습니다.</div>
            ) : (
              <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
                <FieldLabel label="샘플코드">
                  <input
                    value={activeRow.row.sampleCode}
                    disabled={activeRow.meta.state === "D"}
                    onFocus={() =>
                      setEditSession(
                        beginEditSession({
                          rowKey: activeRow.meta.rowKey,
                          columnKey: "sampleCode",
                          value: activeRow.row.sampleCode,
                        }),
                      )
                    }
                    onChange={(event) => {
                      setEditSession((current) =>
                        current
                          ? updateEditSessionDraft(current, event.target.value)
                          : current,
                      );
                      handleFieldChange("sampleCode", event.target.value);
                    }}
                    style={inputStyle}
                  />
                </FieldLabel>
                <FieldLabel label="샘플명">
                  <input
                    value={activeRow.row.sampleName}
                    disabled={activeRow.meta.state === "D"}
                    onChange={(event) =>
                      handleFieldChange("sampleName", event.target.value)
                    }
                    style={inputStyle}
                  />
                </FieldLabel>
                <FieldLabel label="부서">
                  <input
                    value={activeRow.row.department}
                    disabled={activeRow.meta.state === "D"}
                    onChange={(event) =>
                      handleFieldChange("department", event.target.value)
                    }
                    style={inputStyle}
                  />
                </FieldLabel>
                <div
                  style={{
                    display: "grid",
                    gap: 14,
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  <FieldLabel label="직급">
                    <input
                      value={activeRow.row.jobTitle}
                      disabled={activeRow.meta.state === "D"}
                      onChange={(event) =>
                        handleFieldChange("jobTitle", event.target.value)
                      }
                      style={inputStyle}
                    />
                  </FieldLabel>
                  <FieldLabel label="사용여부">
                    <select
                      value={activeRow.row.useYn}
                      disabled={activeRow.meta.state === "D"}
                      onChange={(event) =>
                        handleFieldChange("useYn", event.target.value as "Y" | "N")
                      }
                      style={inputStyle}
                    >
                      <option value="Y">사용</option>
                      <option value="N">미사용</option>
                    </select>
                  </FieldLabel>
                </div>
                <FieldLabel label="정렬순서">
                  <input
                    type="number"
                    value={activeRow.row.sortOrder}
                    disabled={activeRow.meta.state === "D"}
                    onChange={(event) =>
                      handleFieldChange(
                        "sortOrder",
                        Number(event.target.value || "0"),
                      )
                    }
                    style={inputStyle}
                  />
                </FieldLabel>
                <FieldLabel label="비고">
                  <textarea
                    value={activeRow.row.note}
                    disabled={activeRow.meta.state === "D"}
                    onChange={(event) => handleFieldChange("note", event.target.value)}
                    style={{ ...inputStyle, minHeight: 108, resize: "vertical" }}
                  />
                </FieldLabel>
                {Object.entries(activeRow.meta.validationErrors ?? {}).length > 0 ? (
                  <div style={warningCardStyle}>
                    {Object.entries(activeRow.meta.validationErrors ?? {}).map(
                      ([field, issues]) => (
                        <div key={field}>
                          <strong>{field}</strong>: {(issues ?? []).join(", ")}
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>클립보드 붙여넣기</h2>
            <p style={sectionBodyStyle}>
              active cell을 기준으로 직사각형 붙여넣기를 수행합니다. 범위를 넘기면
              신규 행이 추가됩니다.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <button type="button" onClick={handleReadClipboard} style={secondaryButtonStyle}>
                클립보드 읽기
              </button>
              <button type="button" onClick={handleApplyPaste} style={primaryButtonStyle}>
                붙여넣기 적용
              </button>
            </div>
            <textarea
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
              placeholder={"HR-100\t신규인사\t인사운영팀\t선임\tY\t10\t엑셀 복붙 테스트"}
              style={{
                ...inputStyle,
                marginTop: 16,
                minHeight: 140,
                resize: "vertical",
                fontFamily: "Consolas, 'Courier New', monospace",
                fontSize: 13,
              }}
            />
          </section>

          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>엑셀 Import / Export</h2>
            <p style={sectionBodyStyle}>
              템플릿 다운로드, 현재 행 export, import preview를 모두 같은 그리드
              계약 위에서 검증합니다. import 적용은 clipboard와 같은 mutation
              pipeline을 탑니다.
            </p>
            {importPreview ? (
              <div style={infoCardStyle}>
                <div>미리보기 행 수: {importPreview.rows.length}</div>
                <div>헤더: {importPreview.headers.join(", ") || "-"}</div>
                <div>누락 헤더: {importPreview.missingHeaders.join(", ") || "-"}</div>
                <div>알 수 없는 헤더: {importPreview.unknownHeaders.join(", ") || "-"}</div>
                <button
                  type="button"
                  onClick={handleApplyImportPreview}
                  disabled={!importPreview.ok}
                  style={{
                    ...primaryButtonStyle,
                    marginTop: 12,
                    opacity: importPreview.ok ? 1 : 0.6,
                  }}
                >
                  업로드 적용
                </button>
              </div>
            ) : (
              <div style={emptyCardStyle}>불러온 엑셀 미리보기가 없습니다.</div>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>저장 번들 미리보기</h2>
            <p style={sectionBodyStyle}>
              저장 payload는 inserted / updated / deleted diff로 유지됩니다.
            </p>
            <pre style={codeBlockStyle}>
              {JSON.stringify(lastSaveBundle ?? buildSaveBundle(rows), null, 2)}
            </pre>
          </section>
        </div>
      </section>
    </section>
  );
}

function ContextRow(props: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        borderRadius: 16,
        background: "#f8fafc",
        padding: 14,
      }}
    >
      <strong style={{ fontSize: 12, color: "#64748b" }}>{props.label}</strong>
      <span style={{ color: "#0f172a", fontWeight: 700 }}>{props.value}</span>
    </div>
  );
}

function FieldLabel(props: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{props.label}</span>
      {props.children}
    </label>
  );
}

const panelStyle = {
  border: "1px solid #d9e4f1",
  borderRadius: 24,
  padding: 20,
  background: "#fff",
} as const;

const sectionTitleStyle = {
  margin: 0,
  fontSize: 20,
} as const;

const sectionBodyStyle = {
  marginTop: 10,
  color: "#64748b",
  lineHeight: 1.7,
} as const;

const inputStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  background: "#fff",
  color: "#0f172a",
  font: "inherit",
} as const;

const emptyCardStyle = {
  marginTop: 16,
  borderRadius: 18,
  background: "#f8fafc",
  padding: 18,
  color: "#64748b",
} as const;

const warningCardStyle = {
  borderRadius: 18,
  background: "#fff7ed",
  padding: 16,
  color: "#9a3412",
  lineHeight: 1.7,
} as const;

const infoCardStyle = {
  marginTop: 16,
  borderRadius: 18,
  background: "#f8fafc",
  padding: 16,
  color: "#475569",
  lineHeight: 1.8,
} as const;

const codeBlockStyle = {
  marginTop: 16,
  borderRadius: 18,
  padding: 18,
  background: "#0f172a",
  color: "#e2e8f0",
  whiteSpace: "pre-wrap",
  fontSize: 12,
  lineHeight: 1.6,
  overflow: "auto",
} as const;

const secondaryButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  background: "#fff",
  color: "#0f172a",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const primaryButtonStyle = {
  border: "1px solid #0f766e",
  borderRadius: 14,
  background: "#0f766e",
  color: "#fff",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
} as const;
