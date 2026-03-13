import {
  isGridCellEditable,
  type GridActiveCell,
  type GridEditableRule,
  type VibeGridColumn,
} from "@vibe-grid/core";
import {
  defaultLocale,
  formatGridMessage,
  gridMessageKeys,
} from "@vibe-grid/i18n";

type RowRecord = Record<string, unknown>;

export type ClipboardColumn<Row extends RowRecord> = {
  key: Extract<keyof Row, string>;
  editable?: GridEditableRule<Row>;
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
  rowKey?: string;
  columnKey?: string;
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

export type ClipboardSkipSummary = Record<ClipboardSkipReason, number>;

export type ClipboardPlanSummary = {
  matrixRowCount: number;
  matrixColumnCount: number;
  appliedCellCount: number;
  appendedRowCount: number;
  skippedCellCount: number;
  rowOverflowPolicy: ClipboardRowOverflowPolicy;
  rowOverflowCellCount: number;
  skippedCounts: ClipboardSkipSummary;
  validationErrorCount: number;
  firstValidationError?: ClipboardValidationError;
  firstSkippedCell?: ClipboardSkippedCell;
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

export const clipboardSkipReasonOrder: ClipboardSkipReason[] = [
  "emptyMatrix",
  "missingAnchorRow",
  "missingAnchorColumn",
  "columnOverflow",
  "rowOverflow",
  "hidden",
  "readonly",
  "validation",
];

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
    editable: column.editable ?? false,
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
        issues.push(
          formatGridMessage(
            gridMessageKeys.validationRequired,
            {
              columnHeader: column.header,
            },
            defaultLocale,
          ),
        );
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
      const targetRowIndex = anchorRowIndex + rowOffset;
      const rowKey =
        targetRowIndex < input.rowOrder.length
          ? input.rowOrder[targetRowIndex]
          : undefined;
      const column = input.columns[anchorColumnIndex + columnOffset];

      if (!column) {
        skippedCells.push({
          rowOffset,
          columnOffset,
          reason: "columnOverflow",
          rowKey,
        });
        return;
      }

      if (column.hidden) {
        skippedCells.push({
          rowOffset,
          columnOffset,
          reason: "hidden",
          rowKey,
          columnKey: column.key,
        });
        return;
      }
      const contextRow =
        targetRowIndex < input.rowOrder.length
          ? ({
              ...(input.rowsByKey?.get(input.rowOrder[targetRowIndex]) ?? ({} as Row)),
              ...(patchMap.get(input.rowOrder[targetRowIndex]) ?? {}),
            } as Row)
          : ({
              ...(input.createAppendedRow
                ? input.createAppendedRow(targetRowIndex)
                : ({} as Row)),
              ...(appendedRowMap.get(targetRowIndex - input.rowOrder.length) ?? {}),
            } as Row);

      if (!isGridCellEditable(column.editable, contextRow)) {
        skippedCells.push({
          rowOffset,
          columnOffset,
          reason: "readonly",
          rowKey,
          columnKey: column.key,
        });
        return;
      }

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
          rowKey,
          columnKey: column.key,
        });
        validationErrors.push({
          rowOffset,
          columnOffset,
          rowKey,
          columnKey: column.key,
          input: value,
          messages: [
            error instanceof Error
              ? error.message
              : formatGridMessage(
                  gridMessageKeys.clipboardParseFailed,
                  {},
                  defaultLocale,
                ),
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
            rowKey: existingRowKey,
            columnKey: column.key,
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
          columnKey: column.key,
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
          columnKey: column.key,
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

export function summarizeRectangularPastePlan<Row extends RowRecord>(
  plan: RectangularPastePlan<Row>,
): ClipboardPlanSummary {
  const skippedCounts = plan.skippedCells.reduce<ClipboardSkipSummary>(
    (summary, cell) => ({
      ...summary,
      [cell.reason]: (summary[cell.reason] ?? 0) + 1,
    }),
    {
      emptyMatrix: 0,
      missingAnchorRow: 0,
      missingAnchorColumn: 0,
      columnOverflow: 0,
      rowOverflow: 0,
      hidden: 0,
      readonly: 0,
      validation: 0,
    },
  );

  return {
    matrixRowCount: plan.matrix.length,
    matrixColumnCount: Math.max(0, ...plan.matrix.map((row) => row.length)),
    appliedCellCount: plan.appliedCellCount,
    appendedRowCount: plan.appendedRows.length,
    skippedCellCount: plan.skippedCells.length,
    rowOverflowPolicy: plan.rowOverflowPolicy,
    rowOverflowCellCount: plan.rowOverflowCellCount,
    skippedCounts,
    validationErrorCount: plan.validationErrors.length,
    firstValidationError: plan.validationErrors[0],
    firstSkippedCell: plan.skippedCells[0],
  };
}
