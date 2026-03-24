"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  applyRowPatch,
  buildSaveBundle,
  createBenchmarkRows,
  createGridColumnState,
  createLoadedRow,
  createSelectionState,
  getRowStateCounts,
  pruneSelectionState,
  setGridColumnPinning,
  toggleRowDeleted,
  type GridBenchmarkRow,
  type GridColumnState,
  type GridDensity,
  type GridFilter,
  type GridSelectionState,
  type GridSortRule,
  type ManagedGridRow,
  type SaveBundle,
  type VibeGridColumn,
} from "@vibe-grid/core";
import {
  buildRectangularPastePlan,
  createClipboardSchema,
  summarizeRectangularPastePlan,
  type ClipboardPlanSummary,
} from "@vibe-grid/clipboard";
import { VibeGrid, resolveGridDensityMetrics } from "@vibe-grid/react";

const REAL_GRID_SCENARIOS = [10_000, 50_000, 100_000] as const;
const REAL_GRID_DEFAULT_COLUMN = "employeeNo";
const GRID_DENSITY_OPTIONS = ["compact", "default", "comfortable"] as const;

type MetricKey =
  | "scenario"
  | "selection"
  | "filters"
  | "sorting"
  | "columns";

type InteractionMetrics = Record<MetricKey, number | null>;

const INITIAL_METRICS: InteractionMetrics = {
  scenario: null,
  selection: null,
  filters: null,
  sorting: null,
  columns: null,
};

const realGridColumns: VibeGridColumn<GridBenchmarkRow>[] = [
  {
    key: "employeeNo",
    header: "사번",
    width: 150,
    minWidth: 130,
    sortable: true,
    filterable: true,
    editable: false,
    pin: "left",
    filterEditor: {
      type: "text",
      placeholder: "사번 검색",
    },
  },
  {
    key: "employeeName",
    header: "이름",
    width: 180,
    minWidth: 150,
    sortable: true,
    filterable: true,
    editable: true,
    editor: {
      type: "text",
      placeholder: "이름",
    },
    filterEditor: {
      type: "text",
      placeholder: "이름 검색",
    },
  },
  {
    key: "department",
    header: "조직",
    width: 180,
    minWidth: 150,
    sortable: true,
    filterable: true,
    editable: true,
    editor: {
      type: "select",
      options: [
        { label: "인사운영", value: "인사운영" },
        { label: "피플플랫폼", value: "피플플랫폼" },
      ],
    },
    filterEditor: {
      type: "select",
      emptyLabel: "전체",
      options: [
        { label: "인사운영", value: "인사운영" },
        { label: "피플플랫폼", value: "피플플랫폼" },
      ],
    },
  },
  {
    key: "jobTitle",
    header: "직급",
    width: 150,
    minWidth: 130,
    sortable: true,
    filterable: true,
    editable: true,
    editor: {
      type: "select",
      options: [
        { label: "매니저", value: "매니저" },
        { label: "리드", value: "리드" },
        { label: "스태프", value: "스태프" },
      ],
    },
    filterEditor: {
      type: "select",
      emptyLabel: "전체",
      options: [
        { label: "매니저", value: "매니저" },
        { label: "리드", value: "리드" },
        { label: "스태프", value: "스태프" },
      ],
    },
  },
  {
    key: "useYn",
    header: "사용여부",
    width: 120,
    minWidth: 110,
    sortable: true,
    filterable: true,
    editable: true,
    editor: {
      type: "select",
      options: [
        { label: "사용", value: "Y" },
        { label: "미사용", value: "N" },
      ],
    },
    filterEditor: {
      type: "select",
      emptyLabel: "전체",
      options: [
        { label: "사용", value: "Y" },
        { label: "미사용", value: "N" },
      ],
    },
  },
  {
    key: "sortOrder",
    header: "정렬순서",
    width: 130,
    minWidth: 110,
    sortable: true,
    filterable: true,
    editable: true,
    parse: (value) => Number(value),
    validate: [
      (value) => (Number.isFinite(value) ? null : "정렬순서는 숫자여야 합니다."),
    ],
    editor: {
      type: "number",
      min: 0,
      step: 1,
      placeholder: "정렬순서",
    },
    filterEditor: {
      type: "number",
      placeholder: "정렬순서 일치",
      op: "eq",
    },
  },
];

const benchmarkClipboardSchema = createClipboardSchema(realGridColumns);

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function formatMetric(value: number | null) {
  return value == null ? "-" : `${value.toFixed(1)} ms`;
}

function createDefaultSelection(
  rows: ManagedGridRow<GridBenchmarkRow>[],
): GridSelectionState {
  const firstRow = rows[0];

  if (!firstRow) {
    return createSelectionState();
  }

  return createSelectionState({
    activeRowId: firstRow.meta.rowKey,
    activeCell: {
      rowKey: firstRow.meta.rowKey,
      columnKey: REAL_GRID_DEFAULT_COLUMN,
    },
  });
}

function createScenarioRows(rowCount: number) {
  return createBenchmarkRows(rowCount).map((row) => createLoadedRow(row.rowKey, row));
}

function compareValues(left: unknown, right: unknown) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left ?? "").localeCompare(String(right ?? ""), "en-US", {
    numeric: true,
    sensitivity: "base",
  });
}

function applyBenchmarkSorting(
  rows: ManagedGridRow<GridBenchmarkRow>[],
  sorting: GridSortRule[],
) {
  const primary = sorting[0];

  if (!primary) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    const direction = primary.desc ? -1 : 1;
    return (
      compareValues(
        left.row[primary.id as keyof GridBenchmarkRow],
        right.row[primary.id as keyof GridBenchmarkRow],
      ) * direction
    );
  });
}

function applyBenchmarkFilters(
  rows: ManagedGridRow<GridBenchmarkRow>[],
  filters: GridFilter[],
) {
  return filters.reduce((currentRows, filter) => {
    const rawValue =
      typeof filter.value === "string" ? filter.value.trim() : filter.value;

    if (rawValue == null || rawValue === "") {
      return currentRows;
    }

    switch (filter.field) {
      case "employeeNo":
      case "employeeName":
      case "department":
      case "jobTitle":
        return currentRows.filter((managedRow) =>
          String(managedRow.row[filter.field as keyof GridBenchmarkRow])
            .toLowerCase()
            .includes(String(rawValue).toLowerCase()),
        );
      case "useYn":
        return currentRows.filter((managedRow) => managedRow.row.useYn === rawValue);
      case "sortOrder": {
        const numericValue = Number(rawValue);

        if (!Number.isFinite(numericValue)) {
          return currentRows;
        }

        return currentRows.filter((managedRow) => {
          if (filter.op === "gte") {
            return managedRow.row.sortOrder >= numericValue;
          }

          if (filter.op === "lte") {
            return managedRow.row.sortOrder <= numericValue;
          }

          return managedRow.row.sortOrder === numericValue;
        });
      }
      default:
        return currentRows;
    }
  }, rows);
}

function describeSelection(selection: GridSelectionState) {
  if (selection.range) {
    return `범위 ${selection.range.anchor.rowKey} -> ${selection.range.focus.rowKey}`;
  }

  if (selection.activeCell) {
    return `셀 ${selection.activeCell.rowKey} / ${selection.activeCell.columnKey}`;
  }

  if (selection.activeRowId) {
    return `행 ${selection.activeRowId}`;
  }

  return "없음";
}

function createSelectionFingerprint(selection: GridSelectionState) {
  return JSON.stringify({
    activeRowId: selection.activeRowId,
    activeCell: selection.activeCell,
    range: selection.range,
    selectedRowIds: [...selection.selectedRowIds].sort(),
  });
}

export function RealGridPerformanceLab() {
  const [rowCount, setRowCount] = useState<number>(10_000);
  const [density, setDensity] = useState<GridDensity>("compact");
  const [baseRows, setBaseRows] = useState<ManagedGridRow<GridBenchmarkRow>[]>(() =>
    createScenarioRows(10_000),
  );
  const [selectionState, setSelectionState] = useState<GridSelectionState>(
    () => createDefaultSelection(createScenarioRows(10_000)),
  );
  const [sorting, setSorting] = useState<GridSortRule[]>([
    { id: "employeeNo", desc: false },
  ]);
  const [filters, setFilters] = useState<GridFilter[]>([]);
  const [columnState, setColumnState] = useState<GridColumnState>(() =>
    setGridColumnPinning(
      createGridColumnState(realGridColumns),
      REAL_GRID_DEFAULT_COLUMN,
      "left",
    ),
  );
  const [interactionMetrics, setInteractionMetrics] =
    useState<InteractionMetrics>(INITIAL_METRICS);
  const [pasteSummary, setPasteSummary] = useState<ClipboardPlanSummary | null>(null);
  const [lastSaveBundle, setLastSaveBundle] =
    useState<SaveBundle<GridBenchmarkRow> | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "필터 행으로 조회하고, 셀을 직접 수정하거나 붙여넣은 뒤, 저장 번들을 생성해 실제 CRUD 비용을 확인하세요.",
  );
  const interactionStartRef = useRef<Partial<Record<MetricKey, number>>>({});
  const densityMetrics = useMemo(
    () => resolveGridDensityMetrics(density),
    [density],
  );

  const materialized = useMemo(
    () => ({
      rows: baseRows,
      durationMs: 0,
    }),
    [baseRows],
  );

  const shaped = useMemo(() => {
    const startedAt = now();
    const filteredRows = applyBenchmarkFilters(materialized.rows, filters);
    const sortedRows = applyBenchmarkSorting(filteredRows, sorting);

    return {
      rows: sortedRows,
      durationMs: now() - startedAt,
    };
  }, [filters, materialized.rows, sorting]);

  const resolvedSelectionState = useMemo(
    () =>
      pruneSelectionState(
        selectionState,
        shaped.rows.map((row) => row.meta.rowKey),
      ),
    [selectionState, shaped.rows],
  );

  const estimatedCellCount = shaped.rows.length * realGridColumns.length;
  const selectionFingerprint = useMemo(
    () => createSelectionFingerprint(resolvedSelectionState),
    [resolvedSelectionState],
  );
  const sortingFingerprint = useMemo(() => JSON.stringify(sorting), [sorting]);
  const filtersFingerprint = useMemo(() => JSON.stringify(filters), [filters]);
  const columnFingerprint = useMemo(() => JSON.stringify(columnState), [columnState]);
  const businessPinnedLeftCount = columnState.pinning.left.length;
  const businessPinnedRightCount = columnState.pinning.right.length;
  const stateCounts = useMemo(() => getRowStateCounts(baseRows), [baseRows]);
  const prettySaveBundle = useMemo(
    () => JSON.stringify(lastSaveBundle, null, 2),
    [lastSaveBundle],
  );

  function markInteraction(metric: MetricKey) {
    interactionStartRef.current[metric] = now();
  }

  function measureAfterPaint(metric: MetricKey) {
    const startedAt = interactionStartRef.current[metric];

    if (startedAt == null) {
      return;
    }

    delete interactionStartRef.current[metric];
    requestAnimationFrame(() => {
      setInteractionMetrics((current) => ({
        ...current,
        [metric]: Math.max(0, now() - startedAt),
      }));
    });
  }

  useEffect(() => {
    if (interactionStartRef.current.scenario != null) {
      measureAfterPaint("scenario");
    }
  }, [rowCount, shaped.rows.length]);

  useEffect(() => {
    measureAfterPaint("selection");
  }, [selectionFingerprint]);

  useEffect(() => {
    measureAfterPaint("filters");
  }, [filtersFingerprint, shaped.rows.length]);

  useEffect(() => {
    measureAfterPaint("sorting");
  }, [sortingFingerprint, shaped.rows.length]);

  useEffect(() => {
    measureAfterPaint("columns");
  }, [columnFingerprint]);

  function applyScenario(nextRowCount: number) {
    const startedAt = now();
    const nextRows = createScenarioRows(nextRowCount);

    setRowCount(nextRowCount);
    setBaseRows(nextRows);
    setSelectionState(createDefaultSelection(nextRows));
    setPasteSummary(null);
    setLastSaveBundle(null);
    setStatusMessage(
      `시나리오를 ${nextRowCount.toLocaleString("ko-KR")}건으로 초기화했습니다. 필터 행과 삭제 체크 상태도 함께 초기화했습니다.`,
    );
    setInteractionMetrics((current) => ({
      ...current,
      scenario: Math.max(0, now() - startedAt),
    }));
  }

  function handleDeleteCheckToggle(rowKey: string) {
    setBaseRows((currentRows) =>
      currentRows.map((managedRow) => {
        if (managedRow.meta.rowKey !== rowKey) {
          return managedRow;
        }

        return toggleRowDeleted(managedRow) ?? managedRow;
      }),
    );
    setLastSaveBundle(null);
    setStatusMessage(`${rowKey} 행의 삭제 체크를 변경했습니다.`);
  }

  function handleResetWorkingState() {
    setFilters([]);
    setSorting([{ id: "employeeNo", desc: false }]);
    setLastSaveBundle(null);
    applyScenario(rowCount);
  }

  function handleBuildSaveBundle() {
    const bundle = buildSaveBundle(baseRows);
    setLastSaveBundle(bundle);
    setStatusMessage(
      `저장 번들 생성 완료. 입력 ${bundle.inserted.length}건, 수정 ${bundle.updated.length}건, 삭제 ${bundle.deleted.length}건입니다.`,
    );
  }

  function handleClearFilters() {
    markInteraction("filters");
    setFilters([]);
    setStatusMessage("벤치 필터를 초기화했습니다.");
  }

  function handleCellEditCommit(input: {
    rowKey: string;
    columnKey: string;
    draftValue: string;
  }) {
    const column = realGridColumns.find((item) => item.key === input.columnKey);
    if (!column) {
      return;
    }

    setBaseRows((currentRows) =>
      currentRows.map((managedRow) => {
        if (managedRow.meta.rowKey !== input.rowKey) {
          return managedRow;
        }

        const parsedValue = column.parse
          ? column.parse(input.draftValue, managedRow.row)
          : input.draftValue;

        return applyRowPatch(
          managedRow,
          { [input.columnKey]: parsedValue } as Partial<GridBenchmarkRow>,
          "edit",
        );
      }),
    );
    setLastSaveBundle(null);
    setStatusMessage(`${input.rowKey} / ${input.columnKey} 셀을 수정했습니다.`);
  }

  function handleGridClipboardPaste(input: {
    text: string;
    anchorCell?: { rowKey: string; columnKey: string };
    visibleColumnKeys: string[];
  }) {
    const visibleClipboardColumns = input.visibleColumnKeys.flatMap((columnKey) => {
      const column = benchmarkClipboardSchema.find((item) => item.key === columnKey);
      return column ? [column] : [];
    });
    const rowOrder = shaped.rows.map((row) => row.meta.rowKey);
    const rowsByKey = new Map(baseRows.map((row) => [row.meta.rowKey, row.row]));
    const plan = buildRectangularPastePlan({
      text: input.text,
      columns: visibleClipboardColumns,
      rowOrder,
      anchor: input.anchorCell,
      rowOverflowPolicy: "reject",
      rowsByKey,
    });

    const patchMap = new Map(plan.patches.map((entry) => [entry.rowKey, entry.patch]));
    setPasteSummary(summarizeRectangularPastePlan(plan));
    setLastSaveBundle(null);

    if (patchMap.size === 0) {
      setStatusMessage("붙여넣기 결과 적용 가능한 셀 변경이 없었습니다.");
      return;
    }

    setBaseRows((currentRows) =>
      currentRows.map((managedRow) => {
        const patch = patchMap.get(managedRow.meta.rowKey);
        return patch ? applyRowPatch(managedRow, patch, "paste") : managedRow;
      }),
    );
    setStatusMessage(
      `붙여넣기 적용 완료. 행 초과 거부 정책으로 ${plan.patches.length}개 행 패치를 반영했습니다.`,
    );
  }

  return (
    <section data-testid="real-grid-performance-lab" style={{ display: "grid", gap: 16, padding: "0 48px" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {REAL_GRID_SCENARIOS.map((scenario) => (
          <button
            key={scenario}
            type="button"
            data-testid={`real-grid-scenario-${scenario}`}
            onClick={() => {
              markInteraction("scenario");
              startTransition(() => {
                applyScenario(scenario);
              });
            }}
            className={
              scenario === rowCount
                ? "segmented-button segmented-button--active"
                : "segmented-button"
            }
          >
            {scenario.toLocaleString("ko-KR")}건
          </button>
        ))}
        <span style={{ width: 1, height: 20, background: "#e5e5e5", margin: "0 4px" }} />
        {GRID_DENSITY_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            data-testid={`real-grid-density-${option}`}
            onClick={() => setDensity(option)}
            className={
              option === density
                ? "segmented-button segmented-button--active"
                : "segmented-button"
            }
          >
            {option === "compact"
              ? "compact"
              : option === "comfortable"
                ? "comfortable"
                : "default"}
          </button>
        ))}
        <span style={{ width: 1, height: 20, background: "#e5e5e5", margin: "0 4px" }} />
        <button
          type="button"
          data-testid="bench-reset-scenario"
          onClick={handleResetWorkingState}
          className="segmented-button"
        >
          시나리오 초기화
        </button>
        <button
          type="button"
          data-testid="bench-clear-filters"
          onClick={handleClearFilters}
          className="segmented-button"
        >
          필터 초기화
        </button>
        <button
          type="button"
          data-testid="bench-build-save-bundle"
          onClick={handleBuildSaveBundle}
          className="segmented-button segmented-button--active"
        >
          저장 번들 생성
        </button>
        <span style={{ width: 1, height: 20, background: "#e5e5e5", margin: "0 4px" }} />
        <span className="hero-tag">필터 행 = 조회 경로</span>
        <span className="hero-tag">삭제 체크 = 삭제 경로</span>
        <span className="hero-tag">수정 / 붙여넣기 = 수정 경로</span>
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginTop: 16 }}>
        <StatCard
          dataTestId="real-grid-visible-rows"
          label="가공 후 표시 행 수"
          value={shaped.rows.length.toLocaleString("ko-KR")}
        />
        <StatCard
          dataTestId="real-grid-materialize-ms"
          label="행 물질화"
          value={`${materialized.durationMs.toFixed(1)} ms`}
        />
        <StatCard
          dataTestId="real-grid-shape-ms"
          label="필터 + 정렬"
          value={`${shaped.durationMs.toFixed(1)} ms`}
        />
        <StatCard
          dataTestId="real-grid-estimated-cells"
          label="예상 셀 수"
          value={estimatedCellCount.toLocaleString("ko-KR")}
        />
        <StatCard
          dataTestId="real-grid-selection-mode"
          label="선택 상태"
          value={describeSelection(resolvedSelectionState)}
        />
        <StatCard
          dataTestId="real-grid-pinned-summary"
          label="업무 컬럼 고정 수"
          value={`L ${businessPinnedLeftCount} / R ${businessPinnedRightCount}`}
        />
        <StatCard
          dataTestId="real-grid-row-height"
          label="현재 행 높이"
          value={`${densityMetrics.rowHeight}px`}
        />
        <StatCard
          dataTestId="real-grid-density"
          label="밀도"
          value={
            density === "compact"
              ? "조밀"
              : density === "comfortable"
                ? "여유"
                : "기본"
          }
        />
        <StatCard
          dataTestId="real-grid-filter-row"
          label="필터 행"
          value="활성화"
        />
        <StatCard
          dataTestId="real-grid-edit-activation"
          label="편집 진입 방식"
          value="더블클릭"
        />
        <StatCard
          dataTestId="real-grid-state-updated"
          label="수정 행 수"
          value={stateCounts.U.toLocaleString("ko-KR")}
        />
        <StatCard
          dataTestId="real-grid-state-deleted"
          label="삭제 행 수"
          value={stateCounts.D.toLocaleString("ko-KR")}
        />
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginTop: 8 }}>
        <StatCard
          dataTestId="real-grid-scenario-ms"
          label="시나리오 전환"
          value={formatMetric(interactionMetrics.scenario)}
        />
        <StatCard
          dataTestId="real-grid-selection-ms"
          label="선택 반응"
          value={formatMetric(interactionMetrics.selection)}
        />
        <StatCard
          dataTestId="real-grid-filter-ms"
          label="필터 반응"
          value={formatMetric(interactionMetrics.filters)}
        />
        <StatCard
          dataTestId="real-grid-sorting-ms"
          label="정렬 반응"
          value={formatMetric(interactionMetrics.sorting)}
        />
        <StatCard
          dataTestId="real-grid-column-ms"
          label="컬럼 반응"
          value={formatMetric(interactionMetrics.columns)}
        />
        <StatCard
          dataTestId="real-grid-paste-mode"
          label="붙여넣기 정책"
          value="거부 / 수정 가능 셀만"
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <VibeGrid
          gridId="bench-real-grid"
          rows={shaped.rows}
          columns={realGridColumns}
          density={density}
          selectionState={resolvedSelectionState}
          onSelectionStateChange={(nextSelectionState) => {
            markInteraction("selection");
            setSelectionState(nextSelectionState);
          }}
          onDeleteCheckToggle={handleDeleteCheckToggle}
          enableRowCheck
          onCellEditCommit={handleCellEditCommit}
          onClipboardPaste={handleGridClipboardPaste}
          sorting={sorting}
          onSortingChange={(nextSorting) => {
            markInteraction("sorting");
            setSorting(nextSorting);
          }}
          filters={filters}
          onFiltersChange={(nextFilters) => {
            markInteraction("filters");
            setFilters(nextFilters);
          }}
          columnState={columnState}
          onColumnStateChange={(nextColumnState) => {
            markInteraction("columns");
            setColumnState(nextColumnState);
          }}
          enableFilterRow
          height={520}
          emptyMessage="현재 벤치 필터와 일치하는 행이 없습니다."
          virtualization={{
            enabled: true,
            rowHeight: densityMetrics.rowHeight,
            overscan: 12,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          borderRadius: 6,
          border: "1px solid #e5e5e5",
          background: "rgba(248, 250, 252, 0.9)",
          padding: 18,
          color: "#475569",
          lineHeight: 1.8,
        }}
        >
          <div>
            이 패널은 10k / 50k / 100k 행 기준에서 실제 제품 경로를 검증합니다.
            필터 행은 조회, 삭제 체크 컬럼은 삭제 의도, 인라인 수정과 붙여넣기는 수정
            의도를 확인하는 용도입니다. 각 상호작용 후 상단 지표 카드가 함께 갱신되어야
            합니다.
          </div>
        </div>

      <div
        data-testid="bench-status-message"
        style={{
          marginTop: 18,
          borderRadius: 6,
          border: "1px solid #e5e5e5",
          background: "rgba(255, 255, 255, 0.9)",
          padding: 18,
          color: "#334155",
          lineHeight: 1.8,
        }}
      >
        {statusMessage}
      </div>

      <div
        style={{
          marginTop: 18,
          borderRadius: 6,
          border: "1px solid #e5e5e5",
          background: "rgba(255, 255, 255, 0.9)",
          padding: 18,
          color: "#334155",
          lineHeight: 1.8,
        }}
      >
        <div style={{ fontWeight: 700 }}>벤치 붙여넣기 결과</div>
        <div data-testid="real-grid-paste-summary" style={{ marginTop: 8 }}>
          {pasteSummary
            ? `적용 ${pasteSummary.appliedCellCount}, 건너뜀 ${pasteSummary.skippedCellCount}, 검증 오류 ${pasteSummary.validationErrorCount}`
            : "아직 붙여넣기 결과가 없습니다."}
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          borderRadius: 6,
          border: "1px solid #e5e5e5",
          background: "rgba(255, 255, 255, 0.94)",
          padding: 18,
          color: "#334155",
          lineHeight: 1.8,
        }}
      >
        <div style={{ fontWeight: 700 }}>벤치 저장 번들 미리보기</div>
        <pre
          data-testid="bench-save-bundle-preview"
          style={{
            marginTop: 10,
            marginBottom: 0,
            borderRadius: 6,
            background: "#0f172a",
            color: "#dbeafe",
            padding: 16,
            overflowX: "auto",
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          {lastSaveBundle
            ? prettySaveBundle
            : "아직 저장 번들을 생성하지 않았습니다. 셀을 수정하거나 삭제 체크를 토글한 뒤 번들을 생성하세요."}
        </pre>
      </div>
    </section>
  );
}

function StatCard(props: {
  label: string;
  value: string;
  dataTestId?: string;
}) {
  return (
    <article
      data-testid={props.dataTestId}
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 6,
        padding: "8px 12px",
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", letterSpacing: "0.02em" }}>{props.label}</div>
      <strong suppressHydrationWarning style={{ display: "block", marginTop: 2, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{props.value}</strong>
    </article>
  );
}
