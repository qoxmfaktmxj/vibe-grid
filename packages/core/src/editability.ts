import type { GridEditableRule } from "./contracts";

export function isGridCellEditable<Row>(
  editable: GridEditableRule<Row> | undefined,
  row: Row,
) {
  if (typeof editable === "function") {
    return editable(row);
  }

  return editable ?? false;
}
