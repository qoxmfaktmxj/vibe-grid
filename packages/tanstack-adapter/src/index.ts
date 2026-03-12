import type { ColumnDef } from "@tanstack/react-table";
import type { VibeGridColumn } from "@vibe-grid/core";

export function createTanStackColumns<Row extends object>(
  columns: ReadonlyArray<VibeGridColumn<Row>>,
): ColumnDef<Row>[] {
  return columns.map((column) => ({
    id: column.key,
    header: column.header,
    accessorFn: column.accessor
      ? (row) => column.accessor?.(row)
      : (row) => (row as Record<string, unknown>)[column.key],
    enableSorting: column.sortable ?? false,
    enableHiding: true,
    size: column.width,
    minSize: column.minWidth,
    maxSize: column.maxWidth,
    meta: {
      ...column.meta,
      columnKey: column.key,
      editable: column.editable ?? false,
      hidden: column.hidden ?? false,
    },
  }));
}
