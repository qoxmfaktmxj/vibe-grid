import type { ManagedGridRow } from "./contracts";

export type GridTreeSpec<Row extends Record<string, unknown>> = {
  mode: "tree";
  rowKeyField: Extract<keyof Row, string>;
  parentRowKeyField: Extract<keyof Row, string>;
  labelField?: Extract<keyof Row, string>;
  defaultExpandedRowKeys?: string[];
  initiallyExpandAll?: boolean;
  maxDepth?: number;
};

export type GridTreeState = {
  expandedRowKeys: string[];
};

export type GridTreeRuntimeRowMeta = {
  rowKey: string;
  parentRowKey: string | null;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
};

export type GridTreeShapeResult<Row extends Record<string, unknown>> = {
  visibleRows: ManagedGridRow<Row>[];
  runtimeRowMeta: ReadonlyMap<string, GridTreeRuntimeRowMeta>;
};

function uniqueGridTreeRowKeys(rowKeys: Iterable<string>) {
  return [...new Set(rowKeys)];
}

function normalizeGridTreeKey(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

export function createGridTreeState(state?: Partial<GridTreeState>) {
  return {
    expandedRowKeys: uniqueGridTreeRowKeys(state?.expandedRowKeys ?? []),
  } satisfies GridTreeState;
}

export function sanitizeGridTreeState(state?: GridTreeState | null) {
  return createGridTreeState(state ?? undefined);
}

export function isGridTreeRowExpanded(
  treeState: GridTreeState | null | undefined,
  rowKey: string,
) {
  return sanitizeGridTreeState(treeState).expandedRowKeys.includes(rowKey);
}

export function setGridTreeRowsExpanded(
  treeState: GridTreeState | null | undefined,
  rowKeys: Iterable<string>,
  expanded: boolean,
) {
  const nextExpandedKeys = new Set(
    sanitizeGridTreeState(treeState).expandedRowKeys,
  );

  for (const rowKey of rowKeys) {
    if (expanded) {
      nextExpandedKeys.add(rowKey);
      continue;
    }

    nextExpandedKeys.delete(rowKey);
  }

  return createGridTreeState({
    expandedRowKeys: [...nextExpandedKeys],
  });
}

export function toggleGridTreeRowExpanded(
  treeState: GridTreeState | null | undefined,
  rowKey: string,
) {
  return setGridTreeRowsExpanded(
    treeState,
    [rowKey],
    !isGridTreeRowExpanded(treeState, rowKey),
  );
}

export function shapeGridTreeRows<Row extends Record<string, unknown>>(
  rows: readonly ManagedGridRow<Row>[],
  treeSpec: GridTreeSpec<Row>,
  treeState?: GridTreeState | null,
): GridTreeShapeResult<Row> {
  const rowKeyField = treeSpec.rowKeyField;
  const parentRowKeyField = treeSpec.parentRowKeyField;
  const rowMap = new Map<string, ManagedGridRow<Row>>();
  const parentByRowKey = new Map<string, string | null>();
  const childrenByParentKey = new Map<string | null, string[]>();

  for (const managedRow of rows) {
    const runtimeRowKey =
      normalizeGridTreeKey(managedRow.row[rowKeyField]) ?? managedRow.meta.rowKey;
    const runtimeParentRowKey = normalizeGridTreeKey(
      managedRow.row[parentRowKeyField],
    );

    rowMap.set(runtimeRowKey, managedRow);
    parentByRowKey.set(runtimeRowKey, runtimeParentRowKey);

    const childRowKeys = childrenByParentKey.get(runtimeParentRowKey) ?? [];
    childRowKeys.push(runtimeRowKey);
    childrenByParentKey.set(runtimeParentRowKey, childRowKeys);
  }

  const sanitizedState = sanitizeGridTreeState(treeState);
  const defaultExpandedRowKeys = treeSpec.defaultExpandedRowKeys ?? [];
  const expandedRowKeys = new Set<string>(
    treeSpec.initiallyExpandAll
      ? [...childrenByParentKey.values()].flat()
      : treeState != null
        ? sanitizedState.expandedRowKeys
        : defaultExpandedRowKeys,
  );
  const visibleRows: ManagedGridRow<Row>[] = [];
  const runtimeRowMeta = new Map<string, GridTreeRuntimeRowMeta>();
  const visitedRowKeys = new Set<string>();
  const depthLimit = treeSpec.maxDepth ?? 100;

  const visit = (rowKey: string, level: number) => {
    if (visitedRowKeys.has(rowKey) || level > depthLimit) {
      return;
    }

    visitedRowKeys.add(rowKey);
    const managedRow = rowMap.get(rowKey);

    if (!managedRow) {
      return;
    }

    const childRowKeys = childrenByParentKey.get(rowKey) ?? [];
    const hasChildren = childRowKeys.length > 0;
    const isExpanded = hasChildren && expandedRowKeys.has(rowKey);

    visibleRows.push(managedRow);
    runtimeRowMeta.set(rowKey, {
      rowKey,
      parentRowKey: parentByRowKey.get(rowKey) ?? null,
      level,
      hasChildren,
      isExpanded,
    });

    if (!isExpanded) {
      return;
    }

    for (const childRowKey of childRowKeys) {
      visit(childRowKey, level + 1);
    }
  };

  for (const managedRow of rows) {
    const rowKey =
      normalizeGridTreeKey(managedRow.row[rowKeyField]) ?? managedRow.meta.rowKey;
    const parentRowKey = parentByRowKey.get(rowKey) ?? null;

    if (parentRowKey && rowMap.has(parentRowKey)) {
      continue;
    }

    visit(rowKey, 0);
  }

  return {
    visibleRows,
    runtimeRowMeta,
  };
}
