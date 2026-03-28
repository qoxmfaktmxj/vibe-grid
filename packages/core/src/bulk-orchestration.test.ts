import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGridMutationExecutionPlan,
  createGridBulkOrchestrationRequest,
  createGridSelectionSnapshot,
  createLoadedRow,
  DEFAULT_GRID_MUTATION_ORDER,
  validateGridExecutionResult,
} from "./index";
import type { GridSelectionState, SaveBundle } from "./index";

type TestRow = {
  employeeId: string;
  employeeName: string;
};

function createTestRows() {
  return [
    createLoadedRow("row-1", {
      employeeId: "EMP-001",
      employeeName: "Alpha",
    }),
    createLoadedRow("row-2", {
      employeeId: "EMP-002",
      employeeName: "Beta",
    }),
    createLoadedRow("row-3", {
      employeeId: "EMP-003",
      employeeName: "Gamma",
    }),
  ];
}

test("createGridSelectionSnapshot preserves selected rows in row order", () => {
  const rows = createTestRows();
  const selectionState: GridSelectionState = {
    activeRowId: "row-2",
    selectedRowIds: new Set(["row-2", "row-1"]),
    mode: "row",
  };

  const snapshot = createGridSelectionSnapshot({
    gridId: "employee-batch",
    rows,
    selectionState,
    query: {
      pageIndex: 0,
      pageSize: 100,
      sorting: [{ id: "employeeName", desc: false }],
      filters: [],
    },
    getTargetId: (managedRow) => managedRow.row.employeeId,
  });

  assert.equal(snapshot.selectedCount, 2);
  assert.deepEqual(snapshot.selectedRowKeys, ["row-1", "row-2"]);
  assert.deepEqual(snapshot.targetIds, ["EMP-001", "EMP-002"]);
  assert.equal(snapshot.pageSize, 100);
});

test("createGridSelectionSnapshot rejects duplicate target IDs", () => {
  const rows = [
    createLoadedRow("row-1", {
      employeeId: "EMP-001",
      employeeName: "Alpha",
    }),
    createLoadedRow("row-2", {
      employeeId: "EMP-001",
      employeeName: "Beta",
    }),
  ];

  assert.throws(
    () =>
      createGridSelectionSnapshot({
        gridId: "employee-batch",
        rows,
        selectionState: {
          selectedRowIds: new Set(["row-1", "row-2"]),
          mode: "row",
        },
        getTargetId: (managedRow) => managedRow.row.employeeId,
      }),
    /Duplicate target ID/,
  );
});

test("createGridSelectionSnapshot rejects empty selection", () => {
  assert.throws(
    () =>
      createGridSelectionSnapshot({
        gridId: "employee-batch",
        rows: createTestRows(),
        selectionState: {
          selectedRowIds: new Set<string>(),
          mode: "row",
        },
        getTargetId: (managedRow) => managedRow.row.employeeId,
      }),
    /Select at least one row/,
  );
});

test("buildGridMutationExecutionPlan uses the default ordering", () => {
  const bundle: SaveBundle<TestRow> = {
    inserted: [{ employeeId: "EMP-999", employeeName: "Insert" }],
    updated: [
      {
        rowKey: "row-2",
        changes: { employeeName: "Updated" },
      },
    ],
    deleted: [{ rowKey: "row-3" }],
  };

  const plan = buildGridMutationExecutionPlan({ bundle });

  assert.deepEqual(plan.ordering, [...DEFAULT_GRID_MUTATION_ORDER]);
  assert.deepEqual(
    plan.steps.map((step) => [step.phase, step.count]),
    [
      ["delete", 1],
      ["update", 1],
      ["insert", 1],
    ],
  );
});

test("buildGridMutationExecutionPlan respects explicit ordering", () => {
  const bundle: SaveBundle<TestRow> = {
    inserted: [{ employeeId: "EMP-999", employeeName: "Insert" }],
    updated: [],
    deleted: [],
  };

  const plan = buildGridMutationExecutionPlan({
    bundle,
    ordering: ["update", "delete", "insert"],
  });

  assert.deepEqual(plan.ordering, ["update", "delete", "insert"]);
});

test("validateGridExecutionResult rejects async responses without jobId", () => {
  assert.throws(
    () =>
      validateGridExecutionResult({
        mode: "async",
        status: "queued",
        jobId: "",
      }),
    /jobId/,
  );
});

test("createGridBulkOrchestrationRequest requires at least one lane", () => {
  assert.throws(
    () =>
      createGridBulkOrchestrationRequest({
        gridId: "employee-batch",
      }),
    /must include an action lane, a save lane, or both/,
  );
});
