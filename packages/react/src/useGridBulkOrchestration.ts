import { useCallback, useMemo, useState } from "react";
import {
  buildGridMutationExecutionPlan,
  buildSaveBundle,
  createGridBulkOrchestrationRequest,
  createGridSelectionSnapshot,
  validateGridExecutionResult,
  type GridBulkOrchestrationRequest,
  type GridExecutionMode,
  type GridExecutionResult,
  type GridMutationExecutionPlan,
  type GridMutationPhase,
  type GridQuery,
  type GridSelectionSnapshot,
  type GridSelectionState,
  type GridTargetIdResolver,
  type ManagedGridRow,
} from "@vibe-grid/core";

type GridRowRecord = Record<string, unknown>;

export type GridBulkExecutionStatus =
  | "idle"
  | "snapshot_ready"
  | "executing_sync"
  | "submitting_async"
  | "success"
  | "queued"
  | "error";

export type GridBulkExecutionState<
  Row extends GridRowRecord,
  ActionPayload = unknown,
> = {
  status: GridBulkExecutionStatus;
  selectionSnapshot?: GridSelectionSnapshot<Row>;
  mutationPlan?: GridMutationExecutionPlan<Row>;
  lastRequest?: GridBulkOrchestrationRequest<Row, ActionPayload>;
  lastResult?: GridExecutionResult;
  errorMessage?: string;
};

type GridBulkExecutionEvent<
  Row extends GridRowRecord,
  ActionPayload = unknown,
> =
  | {
      type: "selectionSnapshotPrepared";
      snapshot: GridSelectionSnapshot<Row>;
    }
  | {
      type: "mutationPlanPrepared";
      plan: GridMutationExecutionPlan<Row>;
    }
  | {
      type: "requestStarted";
      mode: GridExecutionMode;
      request: GridBulkOrchestrationRequest<Row, ActionPayload>;
    }
  | {
      type: "requestCompleted";
      result: GridExecutionResult;
      request: GridBulkOrchestrationRequest<Row, ActionPayload>;
    }
  | {
      type: "requestFailed";
      errorMessage: string;
      request?: GridBulkOrchestrationRequest<Row, ActionPayload>;
    }
  | {
      type: "reset";
    };

export type GridBulkOrchestrationRunner<
  Row extends GridRowRecord,
  ActionPayload = unknown,
> = (
  request: GridBulkOrchestrationRequest<Row, ActionPayload>,
) => Promise<GridExecutionResult> | GridExecutionResult;

export type UseGridBulkOrchestrationInput<Row extends GridRowRecord> = {
  gridId: string;
  rows: ManagedGridRow<Row>[];
  selectionState: GridSelectionState;
  query?: GridQuery;
  getTargetId: GridTargetIdResolver<Row>;
  mutationOrdering?: readonly GridMutationPhase[];
};

export function createInitialGridBulkExecutionState<
  Row extends GridRowRecord,
  ActionPayload = unknown,
>(): GridBulkExecutionState<Row, ActionPayload> {
  return {
    status: "idle",
  };
}

export function isGridSelectionSnapshotDrifted<Row extends GridRowRecord>(
  snapshot: GridSelectionSnapshot<Row> | undefined,
  selectionState: GridSelectionState,
) {
  if (!snapshot) {
    return false;
  }

  const nextSelected = new Set(selectionState.selectedRowIds);

  if (snapshot.selectedRowKeys.length !== nextSelected.size) {
    return true;
  }

  return snapshot.selectedRowKeys.some((rowKey) => !nextSelected.has(rowKey));
}

export function reduceGridBulkExecutionState<
  Row extends GridRowRecord,
  ActionPayload = unknown,
>(
  state: GridBulkExecutionState<Row, ActionPayload>,
  event: GridBulkExecutionEvent<Row, ActionPayload>,
): GridBulkExecutionState<Row, ActionPayload> {
  switch (event.type) {
    case "selectionSnapshotPrepared":
      return {
        ...state,
        status: "snapshot_ready",
        selectionSnapshot: event.snapshot,
        errorMessage: undefined,
      };
    case "mutationPlanPrepared":
      return {
        ...state,
        mutationPlan: event.plan,
        errorMessage: undefined,
      };
    case "requestStarted":
      return {
        ...state,
        status: event.mode === "sync" ? "executing_sync" : "submitting_async",
        lastRequest: event.request,
        lastResult: undefined,
        errorMessage: undefined,
      };
    case "requestCompleted":
      return {
        ...state,
        status:
          event.result.mode === "async"
            ? "queued"
            : event.result.status === "failed"
              ? "error"
              : "success",
        lastRequest: event.request,
        lastResult: event.result,
        errorMessage:
          event.result.mode === "sync" && event.result.status === "failed"
            ? (event.result.message ?? "Grid orchestration request failed.")
            : undefined,
      };
    case "requestFailed":
      return {
        ...state,
        status: "error",
        lastRequest: event.request ?? state.lastRequest,
        lastResult: undefined,
        errorMessage: event.errorMessage,
      };
    case "reset":
      return {
        ...createInitialGridBulkExecutionState<Row, ActionPayload>(),
        selectionSnapshot: state.selectionSnapshot,
        mutationPlan: state.mutationPlan,
        status: state.selectionSnapshot ? "snapshot_ready" : "idle",
      };
    default:
      return state;
  }
}

export function useGridBulkOrchestration<
  Row extends GridRowRecord,
  ActionPayload = unknown,
>(input: UseGridBulkOrchestrationInput<Row>) {
  const {
    gridId,
    rows,
    selectionState,
    query,
    getTargetId,
    mutationOrdering,
  } = input;
  const [executionState, setExecutionState] = useState<
    GridBulkExecutionState<Row, ActionPayload>
  >(() => createInitialGridBulkExecutionState<Row, ActionPayload>());

  const selectionSnapshotDrifted = useMemo(
    () =>
      isGridSelectionSnapshotDrifted(
        executionState.selectionSnapshot,
        selectionState,
      ),
    [executionState.selectionSnapshot, selectionState],
  );

  const prepareSelectionSnapshot = useCallback(() => {
    try {
      const snapshot = createGridSelectionSnapshot({
        gridId,
        rows,
        selectionState,
        query,
        getTargetId,
      });

      setExecutionState((currentState) =>
        reduceGridBulkExecutionState(currentState, {
          type: "selectionSnapshotPrepared",
          snapshot,
        }),
      );

      return snapshot;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to build selection snapshot.";

      setExecutionState((currentState) =>
        reduceGridBulkExecutionState(currentState, {
          type: "requestFailed",
          errorMessage: message,
        }),
      );

      throw error;
    }
  }, [getTargetId, gridId, query, rows, selectionState]);

  const prepareMutationPlan = useCallback(() => {
    const mutationPlan = buildGridMutationExecutionPlan({
      bundle: buildSaveBundle(rows),
      ordering: mutationOrdering,
    });

    setExecutionState((currentState) =>
      reduceGridBulkExecutionState(currentState, {
        type: "mutationPlanPrepared",
        plan: mutationPlan,
      }),
    );

    return mutationPlan;
  }, [mutationOrdering, rows]);

  const runSelectionAction = useCallback(
    async (input: {
      actionId: string;
      mode: GridExecutionMode;
      payload?: ActionPayload;
      runner: GridBulkOrchestrationRunner<Row, ActionPayload>;
      usePreparedSnapshot?: boolean;
    }) => {
      const selectionSnapshot =
        input.usePreparedSnapshot !== false &&
        executionState.selectionSnapshot &&
        !selectionSnapshotDrifted
          ? executionState.selectionSnapshot
          : prepareSelectionSnapshot();
      const request = createGridBulkOrchestrationRequest<Row, ActionPayload>({
        gridId,
        action: {
          kind: "selectionAction",
          actionId: input.actionId,
          mode: input.mode,
          selection: selectionSnapshot,
          payload: input.payload,
        },
      });

      setExecutionState((currentState) =>
        reduceGridBulkExecutionState(currentState, {
          type: "requestStarted",
          mode: input.mode,
          request,
        }),
      );

      try {
        const result = validateGridExecutionResult(await input.runner(request));

        setExecutionState((currentState) =>
          reduceGridBulkExecutionState(currentState, {
            type: "requestCompleted",
            result,
            request,
          }),
        );

        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Grid selection action failed.";

        setExecutionState((currentState) =>
          reduceGridBulkExecutionState(currentState, {
            type: "requestFailed",
            errorMessage: message,
            request,
          }),
        );

        throw error;
      }
    },
    [
      executionState.selectionSnapshot,
      gridId,
      prepareSelectionSnapshot,
      selectionSnapshotDrifted,
    ],
  );

  const runMutationSave = useCallback(
    async (input: {
      mode: GridExecutionMode;
      runner: GridBulkOrchestrationRunner<Row, ActionPayload>;
      usePreparedPlan?: boolean;
    }) => {
      const mutationPlan =
        input.usePreparedPlan !== false && executionState.mutationPlan
          ? executionState.mutationPlan
          : prepareMutationPlan();
      const request = createGridBulkOrchestrationRequest<Row, ActionPayload>({
        gridId,
        save: {
          kind: "mutationSave",
          mode: input.mode,
          plan: mutationPlan,
        },
      });

      setExecutionState((currentState) =>
        reduceGridBulkExecutionState(currentState, {
          type: "requestStarted",
          mode: input.mode,
          request,
        }),
      );

      try {
        const result = validateGridExecutionResult(await input.runner(request));

        setExecutionState((currentState) =>
          reduceGridBulkExecutionState(currentState, {
            type: "requestCompleted",
            result,
            request,
          }),
        );

        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Grid mutation save failed.";

        setExecutionState((currentState) =>
          reduceGridBulkExecutionState(currentState, {
            type: "requestFailed",
            errorMessage: message,
            request,
          }),
        );

        throw error;
      }
    },
    [executionState.mutationPlan, gridId, prepareMutationPlan],
  );

  const resetExecutionState = useCallback(() => {
    setExecutionState((currentState) =>
      reduceGridBulkExecutionState(currentState, {
        type: "reset",
      }),
    );
  }, []);

  return {
    executionState,
    selectionSnapshot: executionState.selectionSnapshot,
    mutationPlan: executionState.mutationPlan,
    lastRequest: executionState.lastRequest,
    lastResult: executionState.lastResult,
    errorMessage: executionState.errorMessage,
    selectionSnapshotDrifted,
    prepareSelectionSnapshot,
    prepareMutationPlan,
    runSelectionAction,
    runMutationSave,
    resetExecutionState,
  };
}
