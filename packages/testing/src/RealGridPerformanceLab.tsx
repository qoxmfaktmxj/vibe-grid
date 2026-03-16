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
  createBenchmarkRows,
  createGridColumnState,
  createLoadedRow,
  createSelectionState,
  pruneSelectionState,
  setGridColumnPinning,
  type GridBenchmarkRow,
  type GridColumnState,
  type GridFilter,
  type GridSelectionState,
  type GridSortRule,
  type ManagedGridRow,
  type VibeGridColumn,
} from "@vibe-grid/core";
import {
  buildRectangularPastePlan,
  createClipboardSchema,
  summarizeRectangularPastePlan,
  type ClipboardPlanSummary,
} from "@vibe-grid/clipboard";
import { VibeGrid } from "@vibe-grid/react";

const REAL_GRID_SCENARIOS = [10_000, 50_000, 100_000] as const;
const REAL_GRID_DEFAULT_COLUMN = "employeeNo";
const REAL_GRID_ROW_HEIGHT = 42;

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
    header: "Employee No",
    width: 150,
    minWidth: 130,
    sortable: true,
    filterable: true,
    editable: false,
    pin: "left",
    filterEditor: {
      type: "text",
      placeholder: "Search employee no",
    },
  },
  {
    key: "employeeName",
    header: "Employee Name",
    width: 180,
    minWidth: 150,
    sortable: true,
    filterable: true,
    editable: true,
    editor: {
      type: "text",
      placeholder: "Employee name",
    },
    filterEditor: {
      type: "text",
      placeholder: "Search employee name",
    },
  },
  {
    key: "department",
    header: "Department",
    width: 180,
    minWidth: 150,
    sortable: true,
    filterable: true,
    editable: true,
    editor: {
      type: "select",
      options: [
        { label: "HR Operations", value: "HR Operations" },
        { label: "People Platform", value: "People Platform" },
      ],
    },
    filterEditor: {
      type: "select",
      emptyLabel: "All",
      options: [
        { label: "HR Operations", value: "HR Operations" },
        { label: "People Platform", value: "People Platform" },
      ],
    },
  },
  {
    key: "jobTitle",
    header: "Job Title",
    width: 150,
    minWidth: 130,
    sortable: true,
    filterable: true,
    editable: true,
    editor: {
      type: "select",
      options: [
        { label: "Manager", value: "Manager" },
        { label: "Lead", value: "Lead" },
        { label: "Staff", value: "Staff" },
      ],
    },
    filterEditor: {
      type: "select",
      emptyLabel: "All",
      options: [
        { label: "Manager", value: "Manager" },
        { label: "Lead", value: "Lead" },
        { label: "Staff", value: "Staff" },
      ],
    },
  },
  {
    key: "useYn",
    header: "Use YN",
    width: 120,
    minWidth: 110,
    sortable: true,
    filterable: true,
    editable: true,
    editor: {
      type: "select",
      options: [
        { label: "Y", value: "Y" },
        { label: "N", value: "N" },
      ],
    },
    filterEditor: {
      type: "select",
      emptyLabel: "All",
      options: [
        { label: "Y", value: "Y" },
        { label: "N", value: "N" },
      ],
    },
  },
  {
    key: "sortOrder",
    header: "Sort Order",
    width: 130,
    minWidth: 110,
    sortable: true,
    filterable: true,
    editable: true,
    parse: (value) => Number(value),
    validate: [
      (value) =>
        Number.isFinite(value) ? null : "Sort Order must be numeric",
    ],
    editor: {
      type: "number",
      min: 0,
      step: 1,
      placeholder: "Sort order",
    },
    filterEditor: {
      type: "number",
      placeholder: "Exact sort order",
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
    return `range ${selection.range.anchor.rowKey} -> ${selection.range.focus.rowKey}`;
  }

  if (selection.activeCell) {
    return `cell ${selection.activeCell.rowKey} / ${selection.activeCell.columnKey}`;
  }

  if (selection.activeRowId) {
    return `row ${selection.activeRowId}`;
  }

  return "none";
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
  const [baseRows, setBaseRows] = useState<ManagedGridRow<GridBenchmarkRow>[]>(() =>
    createBenchmarkRows(10_000).map((row) => createLoadedRow(row.rowKey, row)),
  );
  const [selectionState, setSelectionState] = useState<GridSelectionState>(
    createSelectionState(),
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
  const interactionStartRef = useRef<Partial<Record<MetricKey, number>>>({});

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

  const resolvedSelectionState = useMemo(() => {
    const nextSelection = pruneSelectionState(
      selectionState,
      shaped.rows.map((row) => row.meta.rowKey),
    );

    return nextSelection.activeRowId
      ? nextSelection
      : createDefaultSelection(shaped.rows);
  }, [selectionState, shaped.rows]);

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
    const nextRows = createBenchmarkRows(nextRowCount).map((row) =>
      createLoadedRow(row.rowKey, row),
    );

    setRowCount(nextRowCount);
    setBaseRows(nextRows);
    setSelectionState(createDefaultSelection(nextRows));
    setPasteSummary(null);
    setInteractionMetrics((current) => ({
      ...current,
      scenario: Math.max(0, now() - startedAt),
    }));
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

    if (patchMap.size === 0) {
      return;
    }

    setBaseRows((currentRows) =>
      currentRows.map((managedRow) => {
        const patch = patchMap.get(managedRow.meta.rowKey);
        return patch ? applyRowPatch(managedRow, patch, "paste") : managedRow;
      }),
    );
  }

  return (
    <section className="section-panel" data-testid="real-grid-performance-lab">
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="hero-tag hero-tag--light">P5 baseline</span>
          <span className="hero-tag hero-tag--light">Actual VibeGrid path</span>
          <span className="hero-tag hero-tag--light">Row virtualization active</span>
        </div>
        <div>
          <h2 className="section-panel__title">Actual VibeGrid performance lab</h2>
          <p className="section-panel__copy">
            This panel measures the real `VibeGrid` render path with pinning, sticky
            header, filter row, range selection, and virtualization enabled together.
            The goal is not a synthetic list benchmark. The goal is to confirm that the
            full product shell remains responsive under combined feature load.
          </p>
        </div>
      </div>

      <div className="segmented-row" style={{ marginTop: 18 }}>
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
            {scenario.toLocaleString("ko-KR")} rows
          </button>
        ))}
      </div>

      <div className="stat-grid" style={{ marginTop: 18 }}>
        <StatCard
          dataTestId="real-grid-visible-rows"
          label="Visible rows after shaping"
          value={shaped.rows.length.toLocaleString("ko-KR")}
        />
        <StatCard
          dataTestId="real-grid-materialize-ms"
          label="Materialize rows"
          value={`${materialized.durationMs.toFixed(1)} ms`}
        />
        <StatCard
          dataTestId="real-grid-shape-ms"
          label="Filter + sort"
          value={`${shaped.durationMs.toFixed(1)} ms`}
        />
        <StatCard
          dataTestId="real-grid-estimated-cells"
          label="Estimated cells"
          value={estimatedCellCount.toLocaleString("ko-KR")}
        />
        <StatCard
          dataTestId="real-grid-selection-mode"
          label="Selection state"
          value={describeSelection(resolvedSelectionState)}
        />
        <StatCard
          dataTestId="real-grid-pinned-summary"
          label="Pinned business columns"
          value={`L ${businessPinnedLeftCount} / R ${businessPinnedRightCount}`}
        />
        <StatCard
          dataTestId="real-grid-row-height"
          label="Current row height"
          value={`${REAL_GRID_ROW_HEIGHT}px`}
        />
        <StatCard
          dataTestId="real-grid-filter-row"
          label="Filter row"
          value="enabled"
        />
        <StatCard
          dataTestId="real-grid-edit-activation"
          label="Edit activation"
          value="doubleClick"
        />
      </div>

      <div className="stat-grid" style={{ marginTop: 14 }}>
        <StatCard
          dataTestId="real-grid-scenario-ms"
          label="Scenario switch"
          value={formatMetric(interactionMetrics.scenario)}
        />
        <StatCard
          dataTestId="real-grid-selection-ms"
          label="Selection interaction"
          value={formatMetric(interactionMetrics.selection)}
        />
        <StatCard
          dataTestId="real-grid-filter-ms"
          label="Filter interaction"
          value={formatMetric(interactionMetrics.filters)}
        />
        <StatCard
          dataTestId="real-grid-sorting-ms"
          label="Sort interaction"
          value={formatMetric(interactionMetrics.sorting)}
        />
        <StatCard
          dataTestId="real-grid-column-ms"
          label="Column interaction"
          value={formatMetric(interactionMetrics.columns)}
        />
        <StatCard
          dataTestId="real-grid-paste-mode"
          label="Paste policy"
          value="reject / editable only"
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <VibeGrid
          gridId="bench-real-grid"
          rows={shaped.rows}
          columns={realGridColumns}
          selectionState={resolvedSelectionState}
          onSelectionStateChange={(nextSelectionState) => {
            markInteraction("selection");
            setSelectionState(nextSelectionState);
          }}
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
          emptyMessage="No rows match the active benchmark filters."
          virtualization={{
            enabled: true,
            rowHeight: REAL_GRID_ROW_HEIGHT,
            overscan: 12,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          borderRadius: 18,
          border: "1px solid rgba(148, 163, 184, 0.22)",
          background: "rgba(248, 250, 252, 0.9)",
          padding: 18,
          color: "#475569",
          lineHeight: 1.8,
        }}
      >
        <div>
          Use this panel to exercise the actual product path at 10k / 50k / 100k rows.
          Switch scenarios, apply a filter, pin a column, and create a range selection.
          The metric cards above should update after each interaction.
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          borderRadius: 18,
          border: "1px solid rgba(148, 163, 184, 0.22)",
          background: "rgba(255, 255, 255, 0.9)",
          padding: 18,
          color: "#334155",
          lineHeight: 1.8,
        }}
      >
        <div style={{ fontWeight: 700 }}>Bench paste behavior</div>
        <div data-testid="real-grid-paste-summary" style={{ marginTop: 8 }}>
          {pasteSummary
            ? `applied ${pasteSummary.appliedCellCount}, skipped ${pasteSummary.skippedCellCount}, validation ${pasteSummary.validationErrorCount}`
            : "No paste applied yet."}
        </div>
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
    <article className="stat-card" data-testid={props.dataTestId}>
      <div className="stat-card__label">{props.label}</div>
      <strong className="stat-card__value">{props.value}</strong>
    </article>
  );
}
