export type GridTreeSpec<Row extends Record<string, unknown>> = {
  mode: "tree";
  rowKeyField: Extract<keyof Row, string>;
  parentRowKeyField: Extract<keyof Row, string>;
  labelField?: Extract<keyof Row, string>;
  defaultExpandedRowKeys?: string[];
  initiallyExpandAll?: boolean;
};

export type GridTreeState = {
  expandedRowKeys: string[];
};

function uniqueGridTreeRowKeys(rowKeys: Iterable<string>) {
  return [...new Set(rowKeys)];
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
