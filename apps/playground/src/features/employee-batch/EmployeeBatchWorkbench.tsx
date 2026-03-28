"use client";

import {
  startTransition,
  useMemo,
  useState,
} from "react";
import {
  applyRowPatch,
  buildGridMutationExecutionPlan,
  buildSaveBundle,
  createInsertedRow,
  createSelectionState,
  isGridMutationExecutionPlanEmpty,
  pruneSelectionState,
  setManyRowSelectionChecked,
  toggleRowDeleted,
  type GridExecutionMode,
  type GridExecutionResult,
  type GridSelectionState,
  type GridSortRule,
} from "@vibe-grid/core";
import {
  VibeGrid,
  resolveGridDensityMetrics,
  useGridBulkOrchestration,
} from "@vibe-grid/react";
import {
  applyEmployeeBatchSorting,
  createEmployeeBatchPreview,
  createEmployeeBatchQuery,
  createLoadedEmployeeBatchRows,
  employeeBatchColumns,
  paginateEmployeeBatchRows,
} from "./model";

const TOTAL_EMPLOYEE_ROWS = 15_000;
const PAGE_SIZE_OPTIONS = [100, 500, 10_000, 15_000] as const;
const DEFAULT_SORTING: GridSortRule[] = [{ id: "employeeNo", desc: false }];

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getExecutionSummary(result: GridExecutionResult | undefined) {
  if (!result) {
    return "실행 이력이 아직 없습니다.";
  }

  if (result.mode === "async") {
    return `작업 접수 완료 · jobId: ${result.jobId}`;
  }

  if (result.status === "failed") {
    return result.message ?? "요청이 실패했습니다.";
  }

  return result.message ?? "요청이 성공적으로 처리되었습니다.";
}

export function EmployeeBatchWorkbench() {
  const [rows, setRows] = useState(() =>
    createLoadedEmployeeBatchRows(TOTAL_EMPLOYEE_ROWS),
  );
  const [selectionState, setSelectionState] = useState<GridSelectionState>(() =>
    createSelectionState(),
  );
  const [sorting, setSorting] = useState<GridSortRule[]>(DEFAULT_SORTING);
  const [pageSize, setPageSize] = useState<number>(15_000);
  const [pageIndex, setPageIndex] = useState(0);
  const [executionMode, setExecutionMode] =
    useState<GridExecutionMode>("sync");
  const densityMetrics = resolveGridDensityMetrics("default");

  const sortedRows = useMemo(
    () => applyEmployeeBatchSorting(rows, sorting),
    [rows, sorting],
  );
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const visibleRows = useMemo(
    () => paginateEmployeeBatchRows(sortedRows, safePageIndex, pageSize),
    [pageSize, safePageIndex, sortedRows],
  );
  const resolvedSelectionState = useMemo(
    () =>
      pruneSelectionState(
        selectionState,
        visibleRows.map((managedRow) => managedRow.meta.rowKey),
      ),
    [selectionState, visibleRows],
  );
  const query = useMemo(
    () => createEmployeeBatchQuery(safePageIndex, pageSize, sorting),
    [pageSize, safePageIndex, sorting],
  );

  const {
    executionState,
    selectionSnapshot,
    lastRequest,
    lastResult,
    errorMessage,
    selectionSnapshotDrifted,
    prepareSelectionSnapshot,
    runSelectionAction,
    resetExecutionState,
  } = useGridBulkOrchestration({
    gridId: "employee-batch-lab",
    rows: visibleRows,
    selectionState: resolvedSelectionState,
    query,
    getTargetId: (managedRow) => managedRow.row.employeeId,
  });
  const currentMutationPlan = useMemo(
    () =>
      buildGridMutationExecutionPlan({
        bundle: buildSaveBundle(rows),
      }),
    [rows],
  );

  const selectedCount = resolvedSelectionState.selectedRowIds.size;
  const selectedRows = useMemo(
    () =>
      visibleRows.filter((managedRow) =>
        resolvedSelectionState.selectedRowIds.has(managedRow.meta.rowKey),
      ),
    [resolvedSelectionState.selectedRowIds, visibleRows],
  );
  const previewRequest = useMemo(() => {
    if (!selectionSnapshot) {
      return null;
    }

    const actionRequest = {
      kind: "selectionAction" as const,
      actionId: "employee-batch-run",
      mode: executionMode,
      selection: selectionSnapshot,
      payload: {
        operation: "bulk-personnel-issue",
      },
    };

    return createEmployeeBatchPreview({
      request: {
        gridId: "employee-batch-lab",
        action: {
          kind: "selectionAction",
          actionId: actionRequest.actionId,
          mode: actionRequest.mode,
        },
        save:
          currentMutationPlan && !isGridMutationExecutionPlanEmpty(currentMutationPlan)
            ? {
                kind: "mutationSave",
                mode: executionMode,
                ordering: currentMutationPlan.ordering,
                counts: Object.fromEntries(
                  currentMutationPlan.steps.map((step) => [step.phase, step.count]),
                ),
              }
            : undefined,
      },
      selectedCount: selectionSnapshot.selectedCount,
      selectionSample: selectionSnapshot.targetIds.slice(0, 5),
      selectionFingerprint: `${selectionSnapshot.targetIds[0] ?? "none"}::${
        selectionSnapshot.targetIds[selectionSnapshot.targetIds.length - 1] ?? "none"
      }::${selectionSnapshot.selectedCount}`,
    });
  }, [currentMutationPlan, executionMode, selectionSnapshot]);

  const mutationSummary = useMemo(
    () =>
      currentMutationPlan?.steps.map((step) => `${step.phase}:${step.count}`).join(" / ") ??
      "delete:0 / update:0 / insert:0",
    [currentMutationPlan],
  );

  function selectVisibleTop(limit: number) {
    const targetRowKeys = visibleRows
      .slice(0, Math.min(limit, visibleRows.length))
      .map((managedRow) => managedRow.meta.rowKey);

    startTransition(() => {
      setSelectionState(() =>
        setManyRowSelectionChecked(
          createSelectionState(),
          targetRowKeys,
          true,
        ),
      );
      resetExecutionState();
    });
  }

  function clearCurrentSelection() {
    setSelectionState(createSelectionState());
    resetExecutionState();
  }

  function applySampleDelete() {
    const targetRowKeys = selectedRows.slice(0, 2).map((row) => row.meta.rowKey);

    if (targetRowKeys.length === 0) {
      return;
    }

    setRows((currentRows) =>
      currentRows.map((managedRow) => {
        if (!targetRowKeys.includes(managedRow.meta.rowKey)) {
          return managedRow;
        }

        return toggleRowDeleted(managedRow) ?? managedRow;
      }),
    );
  }

  function applySampleUpdate() {
    const targetRowKeys = selectedRows.slice(0, 3).map((row) => row.meta.rowKey);

    if (targetRowKeys.length === 0) {
      return;
    }

    setRows((currentRows) =>
      currentRows.map((managedRow) => {
        if (!targetRowKeys.includes(managedRow.meta.rowKey)) {
          return managedRow;
        }

        return applyRowPatch(
          managedRow,
          {
            insuranceRate: Number((managedRow.row.insuranceRate + 0.05).toFixed(2)),
          },
          "edit",
        );
      }),
    );
  }

  function applySampleInsert() {
    setRows((currentRows) => {
      const nextIndex = currentRows.length + 1;

      return [
        createInsertedRow(`employee-row-insert-${nextIndex}`, {
          rowKey: `employee-row-insert-${nextIndex}`,
          employeeId: `EMPID-NEW-${String(nextIndex).padStart(6, "0")}`,
          employeeNo: `NEW-${String(nextIndex).padStart(6, "0")}`,
          employeeName: `신규 직원 ${nextIndex}`,
          department: "인사운영",
          businessUnit: "HQ",
          jobTitle: "Staff",
          employmentType: "정규직",
          insuranceRate: 3.15,
          workStatus: "발령예정",
          location: "서울",
        }),
        ...currentRows,
      ];
    });
  }

  async function runEmployeeBatchAction() {
    await runSelectionAction({
      actionId: "employee-batch-run",
      mode: executionMode,
      payload: {
        operation: "bulk-personnel-issue",
      },
      usePreparedSnapshot: true,
      runner: async (request) => {
        await wait(120);

        const selectedCount =
          request.action?.selection.selectedCount ?? 0;

        if (request.action?.mode === "async") {
          return {
            mode: "async",
            status: "queued",
            jobId: `HR-BATCH-${selectedCount}-${safePageIndex + 1}`,
            message: `${selectedCount.toLocaleString("ko-KR")}명 작업이 접수되었습니다.`,
          };
        }

        return {
          mode: "sync",
          status: "succeeded",
          message: `${selectedCount.toLocaleString("ko-KR")}명 작업이 즉시 완료되었습니다.`,
        };
      },
    });
  }

  return (
    <main
      data-testid="employee-batch-workbench"
      style={{ display: "grid", gap: 20, padding: "24px 48px 48px" }}
    >
      <section
        className="section-panel"
        style={{
          display: "grid",
          gap: 14,
          borderRadius: 18,
          background: "linear-gradient(180deg, #ffffff, #f8fafb)",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="hero-tag">Employee Batch Pilot</span>
          <span className="hero-tag">15,000 Rows</span>
          <span className="hero-tag">Exact ID Snapshot</span>
          <span className="hero-tag">Sync / Async</span>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            직원 목록형 대량 오케스트레이션 검증면
          </h2>
          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
            현재 화면에서 선택한 정확한 직원 ID를 보존하고, 오른쪽 액션 레일에서
            동기 실행 또는 비동기 접수를 선택해 서버 작업을 실행할 수 있는지
            검증합니다.
          </p>
        </div>
      </section>

      <section
        data-testid="employee-batch-summary-strip"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {[
          `전체 ${rows.length.toLocaleString("ko-KR")}행`,
          `현재 표시 ${visibleRows.length.toLocaleString("ko-KR")}행`,
          `선택 ${selectedCount.toLocaleString("ko-KR")}행`,
          `페이지 ${safePageIndex + 1} / ${pageCount}`,
          `변경 ${mutationSummary}`,
        ].map((label) => (
          <span
            key={label}
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(196, 198, 210, 0.35)",
              background: "#f8fafb",
              color: "#475569",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {label}
          </span>
        ))}
      </section>

      <section className="employee-batch-layout">
        <section
          className="section-panel"
          style={{ display: "grid", gap: 14 }}
          data-testid="employee-batch-grid-shell"
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: "#475569" }}>
              페이지 크기
              <select
                data-testid="employee-batch-page-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPageIndex(0);
                }}
                style={{
                  minWidth: 120,
                  border: "1px solid #d4d8df",
                  borderRadius: 8,
                  padding: "8px 10px",
                  background: "#fff",
                }}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.toLocaleString("ko-KR")}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              data-testid="employee-batch-prev-page"
              onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
              className="segmented-button"
            >
              이전 페이지
            </button>
            <button
              type="button"
              data-testid="employee-batch-next-page"
              onClick={() =>
                setPageIndex((current) => Math.min(current + 1, pageCount - 1))
              }
              className="segmented-button"
            >
              다음 페이지
            </button>
            <button
              type="button"
              data-testid="employee-batch-select-visible-10000"
              onClick={() => selectVisibleTop(10_000)}
              className="segmented-button segmented-button--active"
            >
              현재 결과 최대 10,000행 선택
            </button>
            <button
              type="button"
              data-testid="employee-batch-clear-selection"
              onClick={clearCurrentSelection}
              className="segmented-button"
            >
              선택 해제
            </button>
            <button
              type="button"
              data-testid="employee-batch-sample-delete"
              onClick={applySampleDelete}
              className="segmented-button"
            >
              삭제 샘플 2건
            </button>
            <button
              type="button"
              data-testid="employee-batch-sample-update"
              onClick={applySampleUpdate}
              className="segmented-button"
            >
              수정 샘플 3건
            </button>
            <button
              type="button"
              data-testid="employee-batch-sample-insert"
              onClick={applySampleInsert}
              className="segmented-button"
            >
              입력 샘플 1건
            </button>
          </div>

          <div
            data-testid="employee-batch-page-summary"
            style={{ color: "#64748b", fontSize: 13 }}
          >
            정렬:{" "}
            {sorting[0]
              ? `${sorting[0].id} ${sorting[0].desc ? "desc" : "asc"}`
              : "없음"}{" "}
            / 페이지 {safePageIndex + 1} / 총 {pageCount}페이지
          </div>

          <VibeGrid
            gridId="employee-batch-grid"
            rows={visibleRows}
            columns={employeeBatchColumns}
            selectionState={resolvedSelectionState}
            onSelectionStateChange={setSelectionState}
            sorting={sorting}
            onSortingChange={setSorting}
            enableRowCheck
            height={640}
            virtualization={{
              enabled: true,
              rowHeight: densityMetrics.rowHeight,
              overscan: 12,
            }}
            emptyMessage="현재 조건에 맞는 직원이 없습니다."
          />
        </section>

        <aside
          className="section-panel employee-batch-rail"
          data-testid="employee-batch-action-rail"
          style={{
            display: "grid",
            gap: 14,
            alignContent: "start",
            background: "linear-gradient(180deg, #ffffff, #f8fafb)",
          }}
        >
          <section
            data-testid="employee-batch-selection-summary"
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              background: "#fff",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <strong style={{ fontSize: 15 }}>선택 요약</strong>
              <div aria-live="polite">
                현재 선택: {selectedCount.toLocaleString("ko-KR")}행
              </div>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                스냅샷 상태:{" "}
                {selectionSnapshot
                  ? selectionSnapshotDrifted
                    ? "기존 스냅샷 유지 중 / 현재 선택과 다름"
                    : "정확한 대상 스냅샷 준비 완료"
                  : "아직 스냅샷 없음"}
              </div>
              <button
                type="button"
                data-testid="employee-batch-prepare-snapshot"
                onClick={() => {
                  try {
                    prepareSelectionSnapshot();
                  } catch {
                    // Hook state already captures the user-facing error.
                  }
                }}
                className="segmented-button"
              >
                정확한 대상 스냅샷 생성
              </button>
            </div>
          </section>

          <section
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              background: "#fff",
              display: "grid",
              gap: 10,
            }}
          >
            <strong style={{ fontSize: 15 }}>실행 방식</strong>
            <select
              data-testid="employee-batch-mode"
              value={executionMode}
              onChange={(event) =>
                setExecutionMode(event.target.value as GridExecutionMode)
              }
              style={{
                border: "1px solid #d4d8df",
                borderRadius: 8,
                padding: "10px 12px",
                background: "#fff",
              }}
            >
              <option value="sync">즉시 완료형</option>
              <option value="async">작업 접수형</option>
            </select>
            <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
              {executionMode === "sync"
                ? "HTTP 응답에서 완료 결과를 바로 반환합니다."
                : "jobId를 받고 이후 처리는 호스트가 이어서 맡습니다."}
            </div>
          </section>

          <section
            data-testid="employee-batch-preflight"
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              background: "#fff",
              display: "grid",
              gap: 8,
            }}
          >
            <strong style={{ fontSize: 15 }}>사전 검토</strong>
            <div>대상 범위: 정확한 employeeIds 기준</div>
            <div>실행 모드: {executionMode}</div>
            <div>영향 건수: {selectionSnapshot?.selectedCount ?? 0}</div>
            <div style={{ color: "#64748b", fontSize: 13 }}>
              10,000건 이상 작업은 스냅샷을 먼저 고정하고 inline으로 확인한 뒤
              실행합니다.
            </div>
          </section>

          <section
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 12,
              padding: 16,
              background: "#f8fbff",
              display: "grid",
              gap: 10,
            }}
          >
            <strong style={{ fontSize: 15 }}>최종 실행</strong>
            <button
              type="button"
              data-testid="employee-batch-execute"
              onClick={() => void runEmployeeBatchAction()}
              disabled={!selectionSnapshot || executionState.status === "executing_sync" || executionState.status === "submitting_async"}
              className="segmented-button segmented-button--active"
              style={{
                justifyContent: "center",
                opacity:
                  !selectionSnapshot ||
                  executionState.status === "executing_sync" ||
                  executionState.status === "submitting_async"
                    ? 0.55
                    : 1,
                cursor:
                  !selectionSnapshot ||
                  executionState.status === "executing_sync" ||
                  executionState.status === "submitting_async"
                    ? "not-allowed"
                    : "pointer",
              }}
              aria-describedby="employee-batch-execute-help"
            >
              선택한 {selectionSnapshot?.selectedCount?.toLocaleString("ko-KR") ?? 0}
              명 실행
            </button>
            <div
              id="employee-batch-execute-help"
              style={{ color: "#64748b", fontSize: 13 }}
            >
              {!selectionSnapshot
                ? "스냅샷이 준비되어야 실행할 수 있습니다."
                : executionState.status === "executing_sync"
                  ? "즉시 완료형 요청을 실행 중입니다."
                  : executionState.status === "submitting_async"
                    ? "비동기 작업을 접수 중입니다."
                    : "현재 스냅샷을 기준으로 정확한 대상 작업을 보냅니다."}
            </div>
          </section>

          <section
            data-testid="employee-batch-mutation-summary"
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              background: "#fff",
              display: "grid",
              gap: 8,
            }}
          >
            <strong style={{ fontSize: 15 }}>변경 계획</strong>
            <div>기본 순서: delete → update → insert</div>
            <div>{mutationSummary}</div>
          </section>

          <section
            data-testid="employee-batch-result-status"
            aria-live="polite"
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              background: "#fff",
              display: "grid",
              gap: 8,
            }}
          >
            <strong style={{ fontSize: 15 }}>실행 결과</strong>
            <div>{getExecutionSummary(lastResult)}</div>
            {errorMessage ? (
              <div style={{ color: "#b91c1c", fontSize: 13 }}>{errorMessage}</div>
            ) : null}
            <div style={{ color: "#64748b", fontSize: 13 }}>
              상태: {executionState.status}
            </div>
          </section>

          <section
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              background: "#fff",
              display: "grid",
              gap: 8,
            }}
          >
            <strong style={{ fontSize: 15 }}>Payload Preview</strong>
            <pre
              data-testid="employee-batch-request-preview"
              style={{
                margin: 0,
                padding: 14,
                borderRadius: 10,
                background: "#18181b",
                color: "#d4d4d8",
                fontSize: 12,
                lineHeight: 1.6,
                overflowX: "auto",
              }}
            >
              {previewRequest
                ? JSON.stringify(previewRequest, null, 2)
                : "스냅샷을 먼저 생성하면 요청 미리보기가 표시됩니다."}
            </pre>
            {lastRequest ? (
              <div
                data-testid="employee-batch-last-request-kind"
                style={{ color: "#64748b", fontSize: 12 }}
              >
                마지막 실행: {lastRequest.action ? "selectionAction" : "mutationSave"}
              </div>
            ) : null}
            {selectionSnapshot ? (
              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                실제 요청은 메모리에만 유지되고, DOM에는 요약본만 렌더링합니다.
              </div>
            ) : null}
          </section>
        </aside>
      </section>

      <div
        data-testid="employee-batch-mobile-note"
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
          color: "#64748b",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        모바일에서는 이 화면을 실행용으로 지원하지 않습니다. 고위험 대량 인사 작업은
        데스크톱 워크스테이션 기준으로 검증합니다.
      </div>

      <style jsx>{`
        .employee-batch-layout {
          display: grid;
          gap: 20px;
          grid-template-columns: minmax(0, 1fr) 390px;
          align-items: start;
        }

        .employee-batch-rail {
          position: sticky;
          top: 20px;
        }

        @media (max-width: 1279px) {
          .employee-batch-layout {
            grid-template-columns: 1fr;
          }

          .employee-batch-rail {
            position: static;
          }
        }

        @media (max-width: 959px) {
          .employee-batch-layout {
            display: block;
          }

          .employee-batch-rail {
            margin-top: 20px;
          }
        }
      `}</style>
    </main>
  );
}
