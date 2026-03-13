import type { GridActiveCell, VibeGridColumn } from "@vibe-grid/core";

type RowRecord = Record<string, unknown>;

export type ClipboardColumn<Row extends RowRecord> = {
  key: Extract<keyof Row, string>;
  editable?: boolean;
  hidden?: boolean;
  parse?: (value: string) => Row[Extract<keyof Row, string>];
  validate?: (
    value: Row[Extract<keyof Row, string>],
    row: Row,
  ) => string[];
};

export type ClipboardSkipReason =
  | "emptyMatrix"
  | "missingAnchorRow"
  | "missingAnchorColumn"
  | "columnOverflow"
  | "rowOverflow"
  | "hidden"
  | "readonly"
  | "validation";

export type ClipboardSkippedCell = {
  rowOffset: number;
  columnOffset: number;
  reason: ClipboardSkipReason;
};

export type ClipboardValidationError = {
  rowOffset: number;
  columnOffset: number;
  rowKey?: string;
  columnKey: string;
  input: string;
  messages: string[];
};

export type ClipboardRowOverflowPolicy = "reject" | "append";

export type RectangularPastePlan<Row extends RowRecord> = {
  matrix: string[][];
  anchor?: GridActiveCell;
  patches: Array<{
    rowKey: string;
    patch: Partial<Row>;
  }>;
  appendedRows: Partial<Row>[];
  appliedCellCount: number;
  rowOverflowPolicy: ClipboardRowOverflowPolicy;
  rowOverflowCellCount: number;
  skippedCells: ClipboardSkippedCell[];
  validationErrors: ClipboardValidationError[];
};

type RectangularPastePlanInput<Row extends RowRecord> = {
  text: string;
  columns: ReadonlyArray<ClipboardColumn<Row>>;
  rowOrder: readonly string[];
  anchor?: GridActiveCell;
  rowOverflowPolicy?: ClipboardRowOverflowPolicy;
  allowAppendRows?: boolean;
  rowsByKey?: ReadonlyMap<string, Row>;
  createAppendedRow?: (absoluteRowIndex: number) => Row;
};

function isEmptyValue(value: unknown) {
  return (
    value == null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function parseTsv(text: string): string[][] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line, index, rows) => !(index === rows.length - 1 && line === ""))
    .map((line) => line.split("\t"));
}

export function createClipboardSchema<Row extends RowRecord>(
  columns: ReadonlyArray<VibeGridColumn<Row>>,
  parsers?: Partial<
    Record<
      Extract<keyof Row, string>,
      (value: string) => Row[Extract<keyof Row, string>]
    >
  >,
): ClipboardColumn<Row>[] {
  return columns.map((column) => ({
    key: column.key as Extract<keyof Row, string>,
    editable: column.editable ?? true,
    hidden: column.hidden ?? false,
    parse:
      parsers?.[column.key as Extract<keyof Row, string>] ??
      ((value) =>
        (column.parse
          ? (column.parse(value, {} as Row) as Row[Extract<keyof Row, string>])
          : (value as Row[Extract<keyof Row, string>]))),
    validate: (value, row) => {
      const issues: string[] = [];

      if (column.required && isEmptyValue(value)) {
        issues.push(`${column.header} is required.`);
      }

      for (const validator of column.validate ?? []) {
        const result = validator(value, row);
        if (result) {
          issues.push(result);
        }
      }

      return issues;
    },
  }));
}

function resolveRowOverflowPolicy<Row extends RowRecord>(
  input: RectangularPastePlanInput<Row>,
): ClipboardRowOverflowPolicy {
  if (input.rowOverflowPolicy) {
    return input.rowOverflowPolicy;
  }

  return input.allowAppendRows ? "append" : "reject";
}

function countSkippedCellsByReason(
  skippedCells: ClipboardSkippedCell[],
  reason: ClipboardSkipReason,
) {
  return skippedCells.filter((cell) => cell.reason === reason).length;
}

function createEmptyPastePlan<Row extends RowRecord>(
  input: RectangularPastePlanInput<Row>,
  skippedCells: ClipboardSkippedCell[],
): RectangularPastePlan<Row> {
  return {
    matrix: parseTsv(input.text),
    anchor: input.anchor,
    patches: [],
    appendedRows: [],
    appliedCellCount: 0,
    rowOverflowPolicy: resolveRowOverflowPolicy(input),
    rowOverflowCellCount: countSkippedCellsByReason(skippedCells, "rowOverflow"),
    skippedCells,
    validationErrors: [],
  };
}

export function buildRectangularPastePlan<Row extends RowRecord>(
  input: RectangularPastePlanInput<Row>,
): RectangularPastePlan<Row> {
  const matrix = parseTsv(input.text);
  const skippedCells: ClipboardSkippedCell[] = [];
  const validationErrors: ClipboardValidationError[] = [];
  const patchMap = new Map<string, Partial<Row>>();
  const appendedRowMap = new Map<number, Partial<Row>>();
  const rowOverflowPolicy = resolveRowOverflowPolicy(input);

  if (matrix.length === 0) {
    return createEmptyPastePlan(input, [
      { rowOffset: 0, columnOffset: 0, reason: "emptyMatrix" },
    ]);
  }

  if (!input.anchor) {
    return createEmptyPastePlan(input, [
      { rowOffset: 0, columnOffset: 0, reason: "missingAnchorColumn" },
    ]);
  }

  const anchorColumnIndex = input.columns.findIndex(
    (column) => column.key === input.anchor?.columnKey,
  );
  const anchorRowIndex = input.rowOrder.findIndex(
    (rowKey) => rowKey === input.anchor?.rowKey,
  );

  if (anchorColumnIndex === -1) {
    return createEmptyPastePlan(input, [
      { rowOffset: 0, columnOffset: 0, reason: "missingAnchorColumn" },
    ]);
  }

  if (anchorRowIndex === -1) {
    return createEmptyPastePlan(input, [
      { rowOffset: 0, columnOffset: 0, reason: "missingAnchorRow" },
    ]);
  }

  let appliedCellCount = 0;

  matrix.forEach((rowValues, rowOffset) => {
    rowValues.forEach((value, columnOffset) => {
      const column = input.columns[anchorColumnIndex + columnOffset];

      if (!column) {
        skippedCells.push({
          rowOffset,
          columnOffset,
          reason: "columnOverflow",
        });
        return;
      }

      if (column.hidden) {
        skippedCells.push({
          rowOffset,
          columnOffset,
          reason: "hidden",
        });
        return;
      }

      if (column.editable === false) {
        skippedCells.push({
          rowOffset,
          columnOffset,
          reason: "readonly",
        });
        return;
      }

      const targetRowIndex = anchorRowIndex + rowOffset;
      const rowKey =
        targetRowIndex < input.rowOrder.length
          ? input.rowOrder[targetRowIndex]
          : undefined;

      let nextValue: Row[Extract<keyof Row, string>];

      try {
        nextValue = column.parse
          ? column.parse(value)
          : (value as Row[Extract<keyof Row, string>]);
      } catch (error) {
        skippedCells.push({
          rowOffset,
          columnOffset,
          reason: "validation",
        });
        validationErrors.push({
          rowOffset,
          columnOffset,
          rowKey,
          columnKey: column.key,
          input: value,
          messages: [
            error instanceof Error ? error.message : "Failed to parse clipboard value.",
          ],
        });
        return;
      }

      if (targetRowIndex < input.rowOrder.length) {
        const existingRowKey = input.rowOrder[targetRowIndex];
        const patch: Partial<Row> = patchMap.get(existingRowKey) ?? {};
        const baseRow = input.rowsByKey?.get(existingRowKey) ?? ({} as Row);
        const candidateRow = {
          ...baseRow,
          ...patch,
          [column.key]: nextValue,
        } as Row;
        const issues = column.validate?.(nextValue, candidateRow) ?? [];

        if (issues.length > 0) {
          skippedCells.push({
            rowOffset,
            columnOffset,
            reason: "validation",
          });
          validationErrors.push({
            rowOffset,
            columnOffset,
            rowKey: existingRowKey,
            columnKey: column.key,
            input: value,
            messages: issues,
          });
          return;
        }

        patch[column.key] = nextValue;
        patchMap.set(existingRowKey, patch);
        appliedCellCount += 1;
        return;
      }

      if (rowOverflowPolicy === "reject") {
        skippedCells.push({
          rowOffset,
          columnOffset,
          reason: "rowOverflow",
        });
        return;
      }

      const appendedIndex = targetRowIndex - input.rowOrder.length;
      const patch: Partial<Row> = appendedRowMap.get(appendedIndex) ?? {};
      const baseRow = input.createAppendedRow
        ? input.createAppendedRow(targetRowIndex)
        : ({} as Row);
      const candidateRow = {
        ...baseRow,
        ...patch,
        [column.key]: nextValue,
      } as Row;
      const issues = column.validate?.(nextValue, candidateRow) ?? [];

      if (issues.length > 0) {
        skippedCells.push({
          rowOffset,
          columnOffset,
          reason: "validation",
        });
        validationErrors.push({
          rowOffset,
          columnOffset,
          columnKey: column.key,
          input: value,
          messages: issues,
        });
        return;
      }

      patch[column.key] = nextValue;
      appendedRowMap.set(appendedIndex, patch);
      appliedCellCount += 1;
    });
  });

  return {
    matrix,
    anchor: input.anchor,
    patches: [...patchMap.entries()].map(([rowKey, patch]) => ({
      rowKey,
      patch,
    })),
    appendedRows: [...appendedRowMap.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, patch]) => patch),
    appliedCellCount,
    rowOverflowPolicy,
    rowOverflowCellCount: countSkippedCellsByReason(skippedCells, "rowOverflow"),
    skippedCells,
    validationErrors,
  };
}
