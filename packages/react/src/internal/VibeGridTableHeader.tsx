import { flexRender, type Table } from "@tanstack/react-table";
import type { InternalColumnMeta, RowRecord } from "./vibe-grid-types";
import { getStickyCellStyle } from "./vibe-grid-utils";

type VibeGridTableHeaderProps<Row extends RowRecord> = {
  table: Table<Row>;
};

function getSortIndicator(sorted: false | "asc" | "desc") {
  if (sorted === "asc") {
    return "↑";
  }

  if (sorted === "desc") {
    return "↓";
  }

  return "↕";
}

export function VibeGridTableHeader<Row extends RowRecord>({
  table,
}: VibeGridTableHeaderProps<Row>) {
  return (
    <thead style={{ position: "sticky", top: 0, zIndex: 4 }}>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const headerColumn = header.column;
            const headerMeta = headerColumn.columnDef.meta as
              | InternalColumnMeta<Row>
              | undefined;
            const pinned = headerColumn.getIsPinned();
            const background = "#f8fafc";
            const stickyStyle = getStickyCellStyle(headerColumn, background, true);
            const sorted = headerColumn.getIsSorted();
            const canSort = headerColumn.getCanSort() && !headerMeta?.internal;

            return (
              <th
                key={header.id}
                style={{
                  ...stickyStyle,
                  borderBottom: "1px solid #d9e4f1",
                  color: "#0f172a",
                  fontSize: 13,
                  fontWeight: 800,
                  padding: "0 16px",
                  textAlign: "left",
                  width: header.getSize(),
                  minWidth: header.getSize(),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    minHeight: 50,
                  }}
                >
                  {header.isPlaceholder ? null : canSort ? (
                    <button
                      type="button"
                      onClick={headerColumn.getToggleSortingHandler()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        font: "inherit",
                        fontWeight: 800,
                        color: "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span
                        style={{
                          fontSize: 11,
                          color: sorted ? "#0f766e" : "#94a3b8",
                        }}
                      >
                        {getSortIndicator(sorted)}
                      </span>
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}

                  {headerColumn.getCanResize() ? (
                    <div
                      onDoubleClick={() => headerColumn.resetSize()}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      style={{
                        width: 10,
                        height: 30,
                        cursor: "col-resize",
                        display: "grid",
                        placeItems: "center",
                        marginRight: -12,
                        userSelect: "none",
                      }}
                    >
                      <div
                        style={{
                          width: 2,
                          height: 18,
                          borderRadius: 999,
                          background:
                            pinned && sorted
                              ? "rgba(15,118,110,0.45)"
                              : "rgba(148,163,184,0.5)",
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
