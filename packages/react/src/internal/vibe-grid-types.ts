import type {
  GridEditableRule,
  GridEditorSpec,
  GridFilterEditorSpec,
} from "@vibe-grid/core";

export type RowRecord = Record<string, unknown>;

export type InternalColumnMeta<Row extends RowRecord = RowRecord> = {
  columnKey?: string;
  editable?: GridEditableRule<Row>;
  filterable?: boolean;
  filterEditor?: GridFilterEditorSpec;
  internal?: boolean;
  internalControl?: "rowNumber" | "deleteCheck" | "rowState";
  editor?: GridEditorSpec<Row>;
};

export type GridActiveCellLike = {
  rowKey: string;
  columnKey: string;
};
