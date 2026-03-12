import type {
  GridValidationErrors,
  ManagedGridRow,
  VibeGridColumn,
} from "./contracts";

type RowRecord = Record<string, unknown>;

function isEmptyValue(value: unknown) {
  return (
    value == null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function validateRow<Row extends RowRecord>(
  row: Row,
  columns: ReadonlyArray<VibeGridColumn<Row>>,
): GridValidationErrors<Row> {
  const errors: GridValidationErrors<Row> = {};

  for (const column of columns) {
    const value = column.accessor ? column.accessor(row) : row[column.key];
    const columnErrors: string[] = [];

    if (column.required && isEmptyValue(value)) {
      columnErrors.push(`${column.header}은(는) 필수입니다.`);
    }

    for (const validator of column.validate ?? []) {
      const result = validator(value, row);
      if (result) {
        columnErrors.push(result);
      }
    }

    if (columnErrors.length > 0) {
      errors[column.key as Extract<keyof Row, string>] = columnErrors;
    }
  }

  return errors;
}

export function withRowValidation<Row extends RowRecord>(
  managedRow: ManagedGridRow<Row>,
  columns: ReadonlyArray<VibeGridColumn<Row>>,
): ManagedGridRow<Row> {
  const validationErrors = validateRow(managedRow.row, columns);

  return {
    row: managedRow.row,
    meta: {
      ...managedRow.meta,
      validationErrors:
        Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
    },
  };
}

export function validateManagedRows<Row extends RowRecord>(
  rows: readonly ManagedGridRow<Row>[],
  columns: ReadonlyArray<VibeGridColumn<Row>>,
): ManagedGridRow<Row>[] {
  return rows.map((managedRow) => withRowValidation(managedRow, columns));
}

export function countValidationIssues<Row extends RowRecord>(
  rows: readonly ManagedGridRow<Row>[],
) {
  return rows.reduce((count, managedRow) => {
    return (
      count +
      Object.values(managedRow.meta.validationErrors ?? {}).reduce(
        (columnCount, issues) => columnCount + (issues?.length ?? 0),
        0,
      )
    );
  }, 0);
}

export function hasValidationIssues<Row extends RowRecord>(
  rows: readonly ManagedGridRow<Row>[],
) {
  return countValidationIssues(rows) > 0;
}
