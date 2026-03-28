import assert from "node:assert/strict";
import test from "node:test";
import type { GridSelectionState } from "@vibe-grid/core";
import {
  createInitialGridBulkExecutionState,
  isGridSelectionSnapshotDrifted,
  reduceGridBulkExecutionState,
} from "./useGridBulkOrchestration";

test("createInitialGridBulkExecutionState starts idle", () => {
  const state = createInitialGridBulkExecutionState();

  assert.equal(state.status, "idle");
  assert.equal(state.selectionSnapshot, undefined);
  assert.equal(state.lastRequest, undefined);
});

test("selectionSnapshotPrepared transitions to snapshot_ready", () => {
  const state = reduceGridBulkExecutionState(
    createInitialGridBulkExecutionState(),
    {
      type: "selectionSnapshotPrepared",
      snapshot: {
        gridId: "employee-batch",
        targetIds: ["EMP-001"],
        selectedRowKeys: ["row-1"],
        selectedCount: 1,
        createdAt: 1,
      },
    },
  );

  assert.equal(state.status, "snapshot_ready");
  assert.deepEqual(state.selectionSnapshot?.targetIds, ["EMP-001"]);
});

test("requestStarted and sync completion transitions to success", () => {
  const started = reduceGridBulkExecutionState(
    createInitialGridBulkExecutionState(),
    {
      type: "requestStarted",
      mode: "sync",
      request: {
        gridId: "employee-batch",
      },
    },
  );
  const completed = reduceGridBulkExecutionState(started, {
    type: "requestCompleted",
    request: {
      gridId: "employee-batch",
    },
    result: {
      mode: "sync",
      status: "succeeded",
      message: "done",
    },
  });

  assert.equal(started.status, "executing_sync");
  assert.equal(completed.status, "success");
  assert.equal(completed.lastResult?.mode, "sync");
});

test("async completion transitions to queued", () => {
  const completed = reduceGridBulkExecutionState(
    createInitialGridBulkExecutionState(),
    {
      type: "requestCompleted",
      request: {
        gridId: "employee-batch",
      },
      result: {
        mode: "async",
        status: "queued",
        jobId: "JOB-001",
      },
    },
  );

  assert.equal(completed.status, "queued");
  assert.equal(completed.lastResult?.mode, "async");
});

test("requestFailed stores the error message", () => {
  const failed = reduceGridBulkExecutionState(
    createInitialGridBulkExecutionState(),
    {
      type: "requestFailed",
      errorMessage: "payload too large",
    },
  );

  assert.equal(failed.status, "error");
  assert.equal(failed.errorMessage, "payload too large");
});

test("reset preserves the prepared snapshot", () => {
  const withSnapshot = reduceGridBulkExecutionState(
    createInitialGridBulkExecutionState(),
    {
      type: "selectionSnapshotPrepared",
      snapshot: {
        gridId: "employee-batch",
        targetIds: ["EMP-001"],
        selectedRowKeys: ["row-1"],
        selectedCount: 1,
        createdAt: 1,
      },
    },
  );
  const reset = reduceGridBulkExecutionState(withSnapshot, {
    type: "reset",
  });

  assert.equal(reset.status, "snapshot_ready");
  assert.deepEqual(reset.selectionSnapshot?.targetIds, ["EMP-001"]);
  assert.equal(reset.lastRequest, undefined);
});

test("isGridSelectionSnapshotDrifted detects selection mismatch", () => {
  const selectionState: GridSelectionState = {
    selectedRowIds: new Set(["row-1", "row-2"]),
    mode: "row",
  };

  assert.equal(
    isGridSelectionSnapshotDrifted(
      {
        gridId: "employee-batch",
        targetIds: ["EMP-001", "EMP-002"],
        selectedRowKeys: ["row-1", "row-2"],
        selectedCount: 2,
        createdAt: 1,
      },
      selectionState,
    ),
    false,
  );

  assert.equal(
    isGridSelectionSnapshotDrifted(
      {
        gridId: "employee-batch",
        targetIds: ["EMP-001", "EMP-002"],
        selectedRowKeys: ["row-1", "row-2"],
        selectedCount: 2,
        createdAt: 1,
      },
      {
        selectedRowIds: new Set(["row-1"]),
        mode: "row",
      },
    ),
    true,
  );
});
