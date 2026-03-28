import type {
  GridFilter,
  GridQuery,
  GridSelectionState,
  GridSortRule,
  ManagedGridRow,
  SaveBundle,
} from "./contracts";

type GridRowRecord = Record<string, unknown>;

export type GridTargetId = string;

export type GridTargetIdResolver<Row extends GridRowRecord> = (
  row: ManagedGridRow<Row>,
) => GridTargetId;

export type GridExecutionMode = "sync" | "async";

export type GridMutationPhase = "delete" | "update" | "insert";

export const DEFAULT_GRID_MUTATION_ORDER = [
  "delete",
  "update",
  "insert",
] as const satisfies readonly GridMutationPhase[];

export type GridSelectionSnapshot<Row extends GridRowRecord> = {
  gridId: string;
  targetIds: GridTargetId[];
  selectedRowKeys: string[];
  selectedCount: number;
  pageIndex?: number;
  pageSize?: number;
  sorting?: GridSortRule[];
  filters?: GridFilter[];
  createdAt: number;
  previewRows?: Array<{
    rowKey: string;
    targetId: GridTargetId;
    row: Row;
  }>;
};

export type GridSelectionActionRequest<
  Row extends GridRowRecord,
  ActionPayload = unknown,
> = {
  kind: "selectionAction";
  actionId: string;
  mode: GridExecutionMode;
  selection: GridSelectionSnapshot<Row>;
  payload?: ActionPayload;
};

export type GridMutationExecutionPlan<Row extends GridRowRecord> = {
  ordering: GridMutationPhase[];
  bundle: SaveBundle<Row>;
  steps: Array<{
    phase: GridMutationPhase;
    count: number;
  }>;
};

export type GridMutationSaveRequest<Row extends GridRowRecord> = {
  kind: "mutationSave";
  mode: GridExecutionMode;
  plan: GridMutationExecutionPlan<Row>;
};

export type GridBulkOrchestrationRequest<
  Row extends GridRowRecord,
  ActionPayload = unknown,
> = {
  gridId: string;
  action?: GridSelectionActionRequest<Row, ActionPayload>;
  save?: GridMutationSaveRequest<Row>;
};

export type GridExecutionResult =
  | {
      mode: "sync";
      status: "succeeded" | "failed" | "partial";
      message?: string;
    }
  | {
      mode: "async";
      status: "queued";
      jobId: string;
      message?: string;
    };

export function resolveGridMutationOrdering(
  ordering?: readonly GridMutationPhase[],
) {
  if (!ordering) {
    return [...DEFAULT_GRID_MUTATION_ORDER];
  }

  const nextOrdering = [...ordering];
  const validPhases = new Set(DEFAULT_GRID_MUTATION_ORDER);
  const seenPhases = new Set<GridMutationPhase>();

  if (nextOrdering.length !== DEFAULT_GRID_MUTATION_ORDER.length) {
    throw new Error(
      "Grid mutation ordering must include delete, update, and insert exactly once.",
    );
  }

  for (const phase of nextOrdering) {
    if (!validPhases.has(phase)) {
      throw new Error(`Unsupported grid mutation phase: ${phase}`);
    }

    if (seenPhases.has(phase)) {
      throw new Error(`Duplicate grid mutation phase: ${phase}`);
    }

    seenPhases.add(phase);
  }

  return nextOrdering;
}

export function buildGridMutationExecutionPlan<Row extends GridRowRecord>(input: {
  bundle: SaveBundle<Row>;
  ordering?: readonly GridMutationPhase[];
}) {
  const ordering = resolveGridMutationOrdering(input.ordering);
  const phaseCounts: Record<GridMutationPhase, number> = {
    delete: input.bundle.deleted.length,
    update: input.bundle.updated.length,
    insert: input.bundle.inserted.length,
  };

  return {
    ordering,
    bundle: input.bundle,
    steps: ordering.map((phase) => ({
      phase,
      count: phaseCounts[phase],
    })),
  } satisfies GridMutationExecutionPlan<Row>;
}

export function isGridMutationExecutionPlanEmpty<Row extends GridRowRecord>(
  plan: GridMutationExecutionPlan<Row>,
) {
  return plan.steps.every((step) => step.count === 0);
}

export function createGridSelectionSnapshot<Row extends GridRowRecord>(input: {
  gridId: string;
  rows: readonly ManagedGridRow<Row>[];
  selectionState: GridSelectionState;
  query?: Pick<GridQuery, "pageIndex" | "pageSize" | "sorting" | "filters">;
  getTargetId: GridTargetIdResolver<Row>;
  previewRowLimit?: number;
  createdAt?: number;
}) {
  const selectedRowKeys = [...input.selectionState.selectedRowIds];

  if (selectedRowKeys.length === 0) {
    throw new Error("Select at least one row before building a bulk action snapshot.");
  }

  const rowByKey = new Map(
    input.rows.map((managedRow) => [managedRow.meta.rowKey, managedRow] as const),
  );
  const missingRowKeys = selectedRowKeys.filter((rowKey) => !rowByKey.has(rowKey));

  if (missingRowKeys.length > 0) {
    throw new Error(
      `Could not resolve ${missingRowKeys.length} selected rows in the current row set.`,
    );
  }

  const orderedSelectedRows = input.rows.filter((managedRow) =>
    input.selectionState.selectedRowIds.has(managedRow.meta.rowKey),
  );
  const seenTargetIds = new Set<GridTargetId>();
  const targetIds: GridTargetId[] = [];
  const previewRows = orderedSelectedRows
    .slice(0, input.previewRowLimit ?? 5)
    .map((managedRow) => {
      const targetId = input.getTargetId(managedRow);

      return {
        rowKey: managedRow.meta.rowKey,
        targetId,
        row: managedRow.row,
      };
    });

  for (const managedRow of orderedSelectedRows) {
    const targetId = input.getTargetId(managedRow);

    if (typeof targetId !== "string" || targetId.trim() === "") {
      throw new Error(
        `Missing target ID for row ${managedRow.meta.rowKey}.`,
      );
    }

    if (seenTargetIds.has(targetId)) {
      throw new Error(`Duplicate target ID detected: ${targetId}`);
    }

    seenTargetIds.add(targetId);
    targetIds.push(targetId);
  }

  return {
    gridId: input.gridId,
    targetIds,
    selectedRowKeys: orderedSelectedRows.map((managedRow) => managedRow.meta.rowKey),
    selectedCount: orderedSelectedRows.length,
    pageIndex: input.query?.pageIndex,
    pageSize: input.query?.pageSize,
    sorting: input.query?.sorting ? [...input.query.sorting] : undefined,
    filters: input.query?.filters ? [...input.query.filters] : undefined,
    createdAt: input.createdAt ?? Date.now(),
    previewRows,
  } satisfies GridSelectionSnapshot<Row>;
}

export function createGridBulkOrchestrationRequest<
  Row extends GridRowRecord,
  ActionPayload = unknown,
>(input: GridBulkOrchestrationRequest<Row, ActionPayload>) {
  if (!input.action && !input.save) {
    throw new Error(
      "A bulk orchestration request must include an action lane, a save lane, or both.",
    );
  }

  return {
    gridId: input.gridId,
    action: input.action,
    save: input.save,
  } satisfies GridBulkOrchestrationRequest<Row, ActionPayload>;
}

export function validateGridExecutionResult(result: GridExecutionResult) {
  if (result.mode === "async") {
    if (result.status !== "queued") {
      throw new Error("Async grid execution results must use queued status.");
    }

    if (result.jobId.trim() === "") {
      throw new Error("Async grid execution results must include a jobId.");
    }
  }

  if (result.mode === "sync") {
    if (!["succeeded", "failed", "partial"].includes(result.status)) {
      throw new Error(`Unsupported sync grid execution status: ${result.status}`);
    }
  }

  return result;
}
