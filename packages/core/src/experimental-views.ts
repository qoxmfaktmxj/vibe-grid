export type GridGroupPreview<Row extends Record<string, unknown>> = {
  key: string;
  label: string;
  count: number;
  rows: Row[];
};

export type GridTreeNode<Row extends Record<string, unknown>> = {
  id: string;
  label: string;
  row: Row;
  children?: GridTreeNode<Row>[];
};

export type FlattenedGridTreeNode<Row extends Record<string, unknown>> = {
  id: string;
  label: string;
  level: number;
  hasChildren: boolean;
  row: Row;
};

export type GridPivotCell = {
  rowKey: string;
  columnKey: string;
  value: number;
};

export type GridPivotPreview = {
  rowKeys: string[];
  columnKeys: string[];
  cells: GridPivotCell[];
};

function normalizePreviewKey(value: unknown) {
  return String(value ?? "미분류");
}

export function buildGridGroupPreview<Row extends Record<string, unknown>>(
  rows: Row[],
  field: Extract<keyof Row, string>,
) {
  const groups = new Map<string, GridGroupPreview<Row>>();

  for (const row of rows) {
    const key = normalizePreviewKey(row[field]);
    const existing = groups.get(key);

    if (existing) {
      existing.rows.push(row);
      existing.count += 1;
      continue;
    }

    groups.set(key, {
      key,
      label: key,
      count: 1,
      rows: [row],
    });
  }

  return [...groups.values()];
}

export function flattenGridTree<Row extends Record<string, unknown>>(
  nodes: GridTreeNode<Row>[],
  expandedIds?: Iterable<string>,
) {
  const expanded = new Set<string>();
  const collectExpandedIds = (node: GridTreeNode<Row>) => {
    expanded.add(node.id);

    for (const child of node.children ?? []) {
      collectExpandedIds(child);
    }
  };

  if (expandedIds) {
    for (const id of expandedIds) {
      expanded.add(id);
    }
  } else {
    for (const node of nodes) {
      collectExpandedIds(node);
    }
  }
  const result: FlattenedGridTreeNode<Row>[] = [];

  const visit = (node: GridTreeNode<Row>, level: number) => {
    result.push({
      id: node.id,
      label: node.label,
      level,
      hasChildren: !!node.children?.length,
      row: node.row,
    });

    if (!node.children?.length || !expanded.has(node.id)) {
      return;
    }

    for (const child of node.children) {
      visit(child, level + 1);
    }
  };

  for (const node of nodes) {
    visit(node, 0);
  }

  return result;
}

export function buildGridPivotPreview<Row extends Record<string, unknown>>(
  rows: Row[],
  options: {
    rowField: Extract<keyof Row, string>;
    columnField: Extract<keyof Row, string>;
    valueField: Extract<keyof Row, string>;
  },
) {
  const rowKeys = [...new Set(rows.map((row) => normalizePreviewKey(row[options.rowField])))];
  const columnKeys = [
    ...new Set(rows.map((row) => normalizePreviewKey(row[options.columnField]))),
  ];
  const matrix = new Map<string, number>();

  for (const row of rows) {
    const rowKey = normalizePreviewKey(row[options.rowField]);
    const columnKey = normalizePreviewKey(row[options.columnField]);
    const value = Number(row[options.valueField] ?? 0);
    const cellKey = `${rowKey}::${columnKey}`;

    matrix.set(cellKey, (matrix.get(cellKey) ?? 0) + (Number.isFinite(value) ? value : 0));
  }

  return {
    rowKeys,
    columnKeys,
    cells: rowKeys.flatMap((rowKey) =>
      columnKeys.map((columnKey) => ({
        rowKey,
        columnKey,
        value: matrix.get(`${rowKey}::${columnKey}`) ?? 0,
      })),
    ),
  } satisfies GridPivotPreview;
}
