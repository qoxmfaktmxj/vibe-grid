"use client";

import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import {
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
import { VibeGrid } from "@vibe-grid/react";

const REAL_GRID_SCENARIOS = [1_000, 2_500, 5_000] as const;
const REAL_GRID_DEFAULT_COLUMN = "employeeNo";

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
    editable: false,
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
    editable: false,
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
    editable: false,
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
    editable: false,
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
    editable: false,
    filterEditor: {
      type: "number",
      placeholder: "Exact sort order",
      op: "eq",
    },
  },
];

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
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

export function RealGridPerformanceLab() {
  const [rowCount, setRowCount] = useState<number>(2_500);
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
  const deferredRowCount = useDeferredValue(rowCount);

  const materialized = useMemo(() => {
    const startedAt = now();
    const nextRows = createBenchmarkRows(deferredRowCount).map((row) =>
      createLoadedRow(row.rowKey, row),
    );

    return {
      rows: nextRows,
      durationMs: now() - startedAt,
    };
  }, [deferredRowCount]);

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

  return (
    <section className="section-panel" data-testid="real-grid-performance-lab">
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="hero-tag hero-tag--light">P5 baseline</span>
          <span className="hero-tag hero-tag--light">Actual VibeGrid path</span>
          <span className="hero-tag hero-tag--light">
            capped until row virtualization lands
          </span>
        </div>
        <div>
          <h2 className="section-panel__title">Real-grid performance lab</h2>
          <p className="section-panel__copy">
            This lab renders the actual <code>VibeGrid</code> component, not the raw
            virtualized benchmark list. It is the baseline for pinning, sticky header,
            filter row, and range interaction on the current product path.
          </p>
        </div>
      </div>

      <div className="segmented-row" style={{ marginTop: 18 }}>
        {REAL_GRID_SCENARIOS.map((scenario) => (
          <button
            key={scenario}
            type="button"
            data-testid={`real-grid-scenario-${scenario}`}
            onClick={() =>
              startTransition(() => {
                setRowCount(scenario);
              })
            }
            className={
              scenario === rowCount
                ? "segmented-button segmented-button--active"
                : "segmented-button"
            }
          >
            {scenario.toLocaleString("en-US")} rows
          </button>
        ))}
      </div>

      <div className="stat-grid" style={{ marginTop: 18 }}>
        <StatCard
          dataTestId="real-grid-visible-rows"
          label="Visible rows"
          value={shaped.rows.length.toLocaleString("en-US")}
        />
        <StatCard
          dataTestId="real-grid-materialize-ms"
          label="Materialize"
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
          value={estimatedCellCount.toLocaleString("en-US")}
        />
        <StatCard
          dataTestId="real-grid-selection-mode"
          label="Selection"
          value={describeSelection(resolvedSelectionState)}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <VibeGrid
          gridId="bench-real-grid"
          rows={shaped.rows}
          columns={realGridColumns}
          selectionState={resolvedSelectionState}
          onSelectionStateChange={setSelectionState}
          sorting={sorting}
          onSortingChange={setSorting}
          filters={filters}
          onFiltersChange={setFilters}
          columnState={columnState}
          onColumnStateChange={setColumnState}
          enableFilterRow
          height={520}
          emptyMessage="No rows match the current benchmark filter."
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
        <div>Check header menu, filter row, sticky columns, and `Shift + Arrow` range here.</div>
        <div>
          This is intentionally capped at 5,000 visible rows until row virtualization is
          wired into the actual `VibeGrid` rendering path.
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
