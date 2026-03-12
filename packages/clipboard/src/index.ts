import type { GridActiveCell, VibeGridColumn } from "@vibe-grid/core";

type RowRecord = Record<string, unknown>;

export type ClipboardColumn<Row extends RowRecord> = {
  key: Extract<keyof Row, string>;
  editable?: boolean;
  hidden?: boolean;
  parse?: (value: string) => Row[Extract<keyof Row, string>];
};

export type ClipboardSkipReason =
  | "emptyMatrix"
  | "missingAnchorRow"
  | "missingAnchorColumn"
  | "columnOverflow"
  | "rowOverflow"
  | "hidden"
  | "readonly";

export type ClipboardSkippedCell = {
  rowOffset: number;
  columnOffset: number;
  reason: ClipboardSkipReason;
};

export type RectangularPastePlan<Row extends RowRecord> = {
  matrix: string[][];
  anchor?: GridActiveCell;
  patches: Array<{
    rowKey: string;
    patch: Partial<Row>;
  }>;
  appendedRows: Partial<Row>[];
  appliedCellCount: number;
  skippedCells: ClipboardSkippedCell[];
};

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
  }));
}

export function buildRectangularPastePlan<Row extends RowRecord>(input: {
  text: string;
  columns: ReadonlyArray<ClipboardColumn<Row>>;
  rowOrder: readonly string[];
  anchor?: GridActiveCell;
  allowAppendRows?: boolean;
}): RectangularPastePlan<Row> {
  const matrix = parseTsv(input.text);
  const skippedCells: ClipboardSkippedCell[] = [];
  const patchMap = new Map<string, Partial<Row>>();
  const appendedRowMap = new Map<number, Partial<Row>>();

  if (matrix.length === 0) {
    return {
      matrix,
      anchor: input.anchor,
      patches: [],
      appendedRows: [],
      appliedCellCount: 0,
      skippedCells: [{ rowOffset: 0, columnOffset: 0, reason: "emptyMatrix" }],
    };
  }

  if (!input.anchor) {
    return {
      matrix,
      patches: [],
      appendedRows: [],
      appliedCellCount: 0,
      skippedCells: [
        { rowOffset: 0, columnOffset: 0, reason: "missingAnchorColumn" },
      ],
    };
  }

  const anchorColumnIndex = input.columns.findIndex(
    (column) => column.key === input.anchor?.columnKey,
  );
  const anchorRowIndex = input.rowOrder.findIndex(
    (rowKey) => rowKey === input.anchor?.rowKey,
  );

  if (anchorColumnIndex === -1) {
    return {
      matrix,
      anchor: input.anchor,
      patches: [],
      appendedRows: [],
      appliedCellCount: 0,
      skippedCells: [
        { rowOffset: 0, columnOffset: 0, reason: "missingAnchorColumn" },
      ],
    };
  }

  if (anchorRowIndex === -1) {
    return {
      matrix,
      anchor: input.anchor,
      patches: [],
      appendedRows: [],
      appliedCellCount: 0,
      skippedCells: [{ rowOffset: 0, columnOffset: 0, reason: "missingAnchorRow" }],
    };
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
      const nextValue = column.parse
        ? column.parse(value)
        : (value as Row[Extract<keyof Row, string>]);

      if (targetRowIndex < input.rowOrder.length) {
        const rowKey = input.rowOrder[targetRowIndex];
        const patch: Partial<Row> = patchMap.get(rowKey) ?? {};
        patch[column.key] = nextValue;
        patchMap.set(rowKey, patch);
        appliedCellCount += 1;
        return;
      }

      if (!input.allowAppendRows) {
        skippedCells.push({
          rowOffset,
          columnOffset,
          reason: "rowOverflow",
        });
        return;
      }

      const appendedIndex = targetRowIndex - input.rowOrder.length;
      const patch: Partial<Row> = appendedRowMap.get(appendedIndex) ?? {};
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
    skippedCells,
  };
}
