"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createBenchmarkTreeRows,
  createGridTreeState,
  createLoadedRow,
  createSelectionState,
  setGridTreeRowsExpanded,
  shapeGridTreeRows,
  type GridBenchmarkTreeRow,
  type GridDensity,
  type GridSelectionState,
  type GridTreeState,
  type ManagedGridRow,
  type VibeGridColumn,
} from "@vibe-grid/core";
import { VibeGrid } from "@vibe-grid/react";

const TREE_BENCH_SCENARIOS = [1_000, 5_000, 10_000] as const;
const GRID_DENSITY_OPTIONS = ["compact", "default", "comfortable"] as const;

const TREE_SPEC = {
  mode: "tree" as const,
  rowKeyField: "rowKey" as const,
  parentRowKeyField: "parentRowKey" as const,
};

type MetricKey = "treeScenario" | "expandCollapse" | "selection";

type InteractionMetrics = Record<MetricKey, number | null>;

const INITIAL_METRICS: InteractionMetrics = {
  treeScenario: null,
  expandCollapse: null,
  selection: null,
};

const treeColumns: VibeGridColumn<GridBenchmarkTreeRow>[] = [
  {
    key: "employeeNo",
    header: "사번",
    width: 150,
    minWidth: 130,
    sortable: false,
    filterable: false,
    editable: false,
    pin: "left",
  },
  {
    key: "employeeName",
    header: "이름",
    width: 180,
    minWidth: 150,
    sortable: false,
    filterable: false,
    editable: false,
  },
  {
    key: "department",
    header: "조직",
    width: 180,
    minWidth: 150,
    sortable: false,
    filterable: false,
    editable: false,
  },
  {
    key: "jobTitle",
    header: "직급",
    width: 150,
    minWidth: 130,
    sortable: false,
    filterable: false,
    editable: false,
  },
  {
    key: "useYn",
    header: "사용여부",
    width: 120,
    minWidth: 110,
    sortable: false,
    filterable: false,
    editable: false,
  },
  {
    key: "sortOrder",
    header: "정렬순서",
    width: 130,
    minWidth: 110,
    sortable: false,
    filterable: false,
    editable: false,
  },
];

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function formatMetric(value: number | null) {
  return value == null ? "-" : `${value.toFixed(1)} ms`;
}

function createScenarioTreeRows(
  nodeCount: number,
): ManagedGridRow<GridBenchmarkTreeRow>[] {
  return createBenchmarkTreeRows(nodeCount).map((row) =>
    createLoadedRow(row.rowKey, row),
  );
}

function computeMaxDepth(rows: ManagedGridRow<GridBenchmarkTreeRow>[]): number {
  const childrenByParent = new Map<string | null, string[]>();

  for (const managed of rows) {
    const parentKey = managed.row.parentRowKey;
    const siblings = childrenByParent.get(parentKey) ?? [];
    siblings.push(managed.row.rowKey);
    childrenByParent.set(parentKey, siblings);
  }

  let maxDepth = 0;

  const visit = (rowKey: string, depth: number) => {
    if (depth > maxDepth) {
      maxDepth = depth;
    }
    const children = childrenByParent.get(rowKey) ?? [];
    for (const childKey of children) {
      visit(childKey, depth + 1);
    }
  };

  const roots = childrenByParent.get(null) ?? [];
  for (const rootKey of roots) {
    visit(rootKey, 0);
  }

  return maxDepth;
}

function collectParentRowKeys(
  rows: ManagedGridRow<GridBenchmarkTreeRow>[],
): string[] {
  const childrenByParent = new Map<string | null, string[]>();

  for (const managed of rows) {
    const parentKey = managed.row.parentRowKey;
    const siblings = childrenByParent.get(parentKey) ?? [];
    siblings.push(managed.row.rowKey);
    childrenByParent.set(parentKey, siblings);
  }

  const parentKeys: string[] = [];

  for (const managed of rows) {
    const rowKey = managed.row.rowKey;
    if (childrenByParent.has(rowKey)) {
      parentKeys.push(rowKey);
    }
  }

  return parentKeys;
}

function createSelectionFingerprint(selection: GridSelectionState) {
  return JSON.stringify({
    activeRowId: selection.activeRowId,
    activeCell: selection.activeCell,
  });
}

export function TreeBenchPerformanceLab() {
  const [nodeCount, setNodeCount] = useState<number>(1_000);
  const [density, setDensity] = useState<GridDensity>("default");
  const [baseRows, setBaseRows] = useState<ManagedGridRow<GridBenchmarkTreeRow>[]>(
    () => createScenarioTreeRows(1_000),
  );
  const [treeState, setTreeState] = useState<GridTreeState>(() =>
    createGridTreeState(),
  );
  const [selectionState, setSelectionState] = useState<GridSelectionState>(
    () => createSelectionState(),
  );
  const [interactionMetrics, setInteractionMetrics] =
    useState<InteractionMetrics>(INITIAL_METRICS);

  const interactionStartRef = useRef<Partial<Record<MetricKey, number>>>({});

  const treeShape = useMemo(
    () => shapeGridTreeRows(baseRows, TREE_SPEC, treeState),
    [baseRows, treeState],
  );

  const visibleRowCount = treeShape.visibleRows.length;

  const maxDepth = useMemo(() => computeMaxDepth(baseRows), [baseRows]);

  const parentRowKeys = useMemo(() => collectParentRowKeys(baseRows), [baseRows]);

  const selectionFingerprint = useMemo(
    () => createSelectionFingerprint(selectionState),
    [selectionState],
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
    if (interactionStartRef.current.treeScenario != null) {
      measureAfterPaint("treeScenario");
    }
  }, [nodeCount, visibleRowCount]);

  useEffect(() => {
    measureAfterPaint("selection");
  }, [selectionFingerprint]);

  useEffect(() => {
    if (interactionStartRef.current.expandCollapse != null) {
      measureAfterPaint("expandCollapse");
    }
  }, [treeState]);

  function applyScenario(nextNodeCount: number) {
    markInteraction("treeScenario");
    const nextRows = createScenarioTreeRows(nextNodeCount);
    setNodeCount(nextNodeCount);
    setBaseRows(nextRows);
    setTreeState(createGridTreeState());
    setSelectionState(createSelectionState());
    setInteractionMetrics(INITIAL_METRICS);
  }

  function handleExpandAll() {
    markInteraction("expandCollapse");
    setTreeState(
      setGridTreeRowsExpanded(createGridTreeState(), parentRowKeys, true),
    );
  }

  function handleCollapseAll() {
    markInteraction("expandCollapse");
    setTreeState(createGridTreeState({ expandedRowKeys: [] }));
  }

  return (
    <div data-testid="tree-bench-performance-lab" style={{ display: "grid", gap: 16, padding: "0 48px" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {TREE_BENCH_SCENARIOS.map((scenario) => (
          <button
            key={scenario}
            type="button"
            data-testid={`tree-bench-scenario-${scenario}`}
            onClick={() => applyScenario(scenario)}
            className={
              scenario === nodeCount
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
            data-testid={`tree-bench-density-${option}`}
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
          data-testid="tree-bench-expand-all"
          onClick={handleExpandAll}
          className="segmented-button segmented-button--active"
        >
          전체 펼치기
        </button>
        <button
          type="button"
          data-testid="tree-bench-collapse-all"
          onClick={handleCollapseAll}
          className="segmented-button"
        >
          전체 접기
        </button>
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginTop: 16 }}>
        <StatCard
          dataTestId="tree-bench-total-nodes"
          label="총 노드 수"
          value={baseRows.length.toLocaleString("ko-KR")}
        />
        <StatCard
          dataTestId="tree-bench-visible-rows"
          label="표시 행 수"
          value={visibleRowCount.toLocaleString("ko-KR")}
        />
        <StatCard
          dataTestId="tree-bench-max-depth"
          label="최대 깊이"
          value={String(maxDepth)}
        />
        <StatCard
          dataTestId="tree-bench-scenario-ms"
          label="시나리오 전환"
          value={formatMetric(interactionMetrics.treeScenario)}
        />
        <StatCard
          dataTestId="tree-bench-expand-collapse-ms"
          label="확장/축소"
          value={formatMetric(interactionMetrics.expandCollapse)}
        />
        <StatCard
          dataTestId="tree-bench-selection-ms"
          label="선택 반응"
          value={formatMetric(interactionMetrics.selection)}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <VibeGrid
          gridId="bench-tree-grid"
          rows={baseRows}
          columns={treeColumns}
          density={density}
          selectionState={selectionState}
          onSelectionStateChange={(nextSelectionState) => {
            markInteraction("selection");
            setSelectionState(nextSelectionState);
          }}
          enableRowCheck={true}
          tree={{
            spec: TREE_SPEC,
            state: treeState,
            onStateChange: setTreeState,
          }}
          height={480}
          virtualization={{
            enabled: true,
            overscan: 10,
          }}
        />
      </div>
    </div>
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
