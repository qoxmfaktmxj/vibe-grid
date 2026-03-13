import type { GridEditorSpec } from "@vibe-grid/core";

export type RowRecord = Record<string, unknown>;

export type InternalColumnMeta<Row extends RowRecord = RowRecord> = {
  columnKey?: string;
  editable?: boolean;
  internal?: boolean;
  editor?: GridEditorSpec<Row>;
};

export type GridActiveCellLike = {
  rowKey: string;
  columnKey: string;
};
