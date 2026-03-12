import type {
  GridMutationSource,
  GridStateCounts,
  ManagedGridRow,
  RowState,
  SaveBundle,
} from "./contracts";

type RowRecord = Record<string, unknown>;

function cloneRow<Row extends RowRecord>(row: Row): Row {
  return { ...row };
}

function pickFields<Row extends RowRecord>(
  row: Row,
  fields: Iterable<string>,
): Partial<Row> {
  const patch: Partial<Row> = {};

  for (const field of fields) {
    patch[field as keyof Row] = row[field as keyof Row];
  }

  return patch;
}

function resolveNextState(
  currentState: RowState,
  dirtyFieldCount: number,
): RowState {
  if (currentState === "I" || currentState === "D") {
    return currentState;
  }

  return dirtyFieldCount === 0 ? "N" : "U";
}

export function createLoadedRow<Row extends RowRecord>(
  rowKey: string,
  row: Row,
): ManagedGridRow<Row> {
  const snapshot = cloneRow(row);

  return {
    row: snapshot,
    meta: {
      rowKey,
      state: "N",
      original: cloneRow(snapshot),
      dirtyFields: new Set<string>(),
      lastMutationSource: "load",
    },
  };
}

export function createInsertedRow<Row extends RowRecord>(
  rowKey: string,
  row: Row,
  options?: { copiedFrom?: string; source?: Extract<GridMutationSource, "insert" | "copy" | "import" | "paste"> },
): ManagedGridRow<Row> {
  const snapshot = cloneRow(row);

  return {
    row: snapshot,
    meta: {
      rowKey,
      state: "I",
      dirtyFields: new Set(Object.keys(snapshot)),
      copiedFrom: options?.copiedFrom,
      lastMutationSource: options?.source ?? "insert",
    },
  };
}

export function applyRowPatch<Row extends RowRecord>(
  managedRow: ManagedGridRow<Row>,
  patch: Partial<Row>,
  source: Extract<GridMutationSource, "edit" | "paste" | "import" | "copy"> = "edit",
): ManagedGridRow<Row> {
  const nextRow = {
    ...managedRow.row,
    ...patch,
  };
  const dirtyFields = new Set(managedRow.meta.dirtyFields);

  for (const field of Object.keys(patch) as Array<Extract<keyof Row, string>>) {
    const nextValue = nextRow[field];
    const originalValue = managedRow.meta.original?.[field];

    if (managedRow.meta.original && Object.is(nextValue, originalValue)) {
      dirtyFields.delete(field);
    } else {
      dirtyFields.add(field);
    }
  }

  return {
    row: nextRow,
    meta: {
      ...managedRow.meta,
      dirtyFields,
      state: resolveNextState(managedRow.meta.state, dirtyFields.size),
      lastMutationSource: source,
    },
  };
}

export function toggleRowDeleted<Row extends RowRecord>(
  managedRow: ManagedGridRow<Row>,
): ManagedGridRow<Row> | null {
  if (managedRow.meta.state === "I") {
    return null;
  }

  if (managedRow.meta.state === "D") {
    return {
      row: managedRow.row,
      meta: {
        ...managedRow.meta,
        state: managedRow.meta.dirtyFields.size === 0 ? "N" : "U",
        lastMutationSource: "deleteToggle",
      },
    };
  }

  return {
    row: managedRow.row,
    meta: {
      ...managedRow.meta,
      state: "D",
      lastMutationSource: "deleteToggle",
    },
  };
}

export function buildSaveBundle<Row extends RowRecord>(
  rows: readonly ManagedGridRow<Row>[],
): SaveBundle<Row> {
  return rows.reduce<SaveBundle<Row>>(
    (bundle, managedRow) => {
      if (managedRow.meta.state === "I") {
        bundle.inserted.push(cloneRow(managedRow.row));
        return bundle;
      }

      if (managedRow.meta.state === "U") {
        const changeFields = managedRow.meta.dirtyFields;

        if (changeFields.size > 0) {
          bundle.updated.push({
            rowKey: managedRow.meta.rowKey,
            changes: pickFields(managedRow.row, changeFields),
            original: managedRow.meta.original
              ? pickFields(managedRow.meta.original, changeFields)
              : undefined,
          });
        }

        return bundle;
      }

      if (managedRow.meta.state === "D") {
        bundle.deleted.push({
          rowKey: managedRow.meta.rowKey,
          original: managedRow.meta.original
            ? cloneRow(managedRow.meta.original)
            : cloneRow(managedRow.row),
        });
      }

      return bundle;
    },
    {
      inserted: [],
      updated: [],
      deleted: [],
    },
  );
}

export function getRowStateCounts<Row extends RowRecord>(
  rows: readonly ManagedGridRow<Row>[],
): GridStateCounts {
  return rows.reduce<GridStateCounts>(
    (counts, managedRow) => {
      counts[managedRow.meta.state] += 1;
      return counts;
    },
    {
      N: 0,
      I: 0,
      U: 0,
      D: 0,
    },
  );
}

export function markRowsSaved<Row extends RowRecord>(
  rows: readonly ManagedGridRow<Row>[],
): ManagedGridRow<Row>[] {
  return rows
    .filter((managedRow) => managedRow.meta.state !== "D")
    .map((managedRow) =>
      createLoadedRow(managedRow.meta.rowKey, cloneRow(managedRow.row)),
    );
}
