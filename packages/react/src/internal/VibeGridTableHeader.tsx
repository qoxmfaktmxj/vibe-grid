import type { GridFilter } from "@vibe-grid/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { defaultLocale, getGridMessage, gridMessageKeys } from "@vibe-grid/i18n";
import { vibeGridThemeTokens } from "@vibe-grid/theme-shadcn";
import {
  VibeGridHeaderMenu,
  type GridHeaderMenuAction,
  type MenuActionItem,
} from "./VibeGridHeaderMenu";
import { VibeGridFilterRow } from "./VibeGridFilterRow";
import type { InternalColumnMeta, RowRecord } from "./vibe-grid-types";
import { getStickyCellStyle } from "./vibe-grid-utils";

type VibeGridTableHeaderProps<Row extends RowRecord> = {
  table: Table<Row>;
  filters?: GridFilter[];
  onFiltersChange?: (filters: GridFilter[]) => void;
  enableFilterRow?: boolean;
};

function getSortIndicator(sorted: false | "asc" | "desc") {
  if (sorted === "asc") {
    return "^";
  }

  if (sorted === "desc") {
    return "v";
  }

  return "-";
}

function getPinIndicator(pinState: false | "left" | "right") {
  if (pinState === "left") {
    return "L";
  }

  if (pinState === "right") {
    return "R";
  }

  return null;
}

function hasMeaningfulFilterValue(value: GridFilter["value"]) {
  if (value == null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  return true;
}

function getColumnFilterCount(columnKey: string | undefined, filters?: GridFilter[]) {
  if (!columnKey || !filters) {
    return 0;
  }

  return filters.filter(
    (filter) => filter.field === columnKey && hasMeaningfulFilterValue(filter.value),
  ).length;
}

export function VibeGridTableHeader<Row extends RowRecord>({
  table,
  filters,
  onFiltersChange,
  enableFilterRow = false,
}: VibeGridTableHeaderProps<Row>) {
  const headerRef = useRef<HTMLTableSectionElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [openColumnKey, setOpenColumnKey] = useState<string>();

  const visibleBusinessColumnCount = table.getVisibleLeafColumns().filter((column) => {
    const meta = column.columnDef.meta as InternalColumnMeta<Row> | undefined;
    return !meta?.internal && !!meta?.columnKey;
  }).length;

  const focusTriggerButton = useCallback((columnKey?: string) => {
    if (columnKey) {
      triggerRefs.current[columnKey]?.focus();
    }
  }, []);

  const closeMenu = useCallback((focusTrigger = true) => {
    const columnKey = openColumnKey;
    setOpenColumnKey(undefined);

    if (focusTrigger) {
      focusTriggerButton(columnKey);
    }
  }, [focusTriggerButton, openColumnKey]);

  useEffect(() => {
    if (!openColumnKey) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (headerRef.current?.contains(event.target as Node)) {
        return;
      }

      closeMenu(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, openColumnKey]);

  return (
    <thead ref={headerRef} style={{ position: "sticky", top: 0, zIndex: 4 }}>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const headerColumn = header.column;
            const headerMeta = headerColumn.columnDef.meta as
              | InternalColumnMeta<Row>
              | undefined;
            const columnKey = headerMeta?.columnKey;
            const pinned = headerColumn.getIsPinned();
            const sorted = headerColumn.getIsSorted();
            const canSort = headerColumn.getCanSort() && !headerMeta?.internal;
            const canShowMenu = !headerMeta?.internal && !!columnKey;
            const isMenuOpen = !!columnKey && openColumnKey === columnKey;
            const pinIndicator = getPinIndicator(pinned);
            const filterCount = getColumnFilterCount(columnKey, filters);
            const isFiltered = filterCount > 0;
            const background = isMenuOpen
              ? vibeGridThemeTokens.header.menuOpenBackground
              : pinned
                ? vibeGridThemeTokens.header.pinnedBackground
                : isFiltered
                  ? vibeGridThemeTokens.header.filteredBackground
                  : sorted
                    ? vibeGridThemeTokens.header.sortedBackground
                    : vibeGridThemeTokens.header.idleBackground;
            const stickyStyle = getStickyCellStyle(headerColumn, background, true);

            const menuItems: MenuActionItem[] = columnKey
              ? [
                  {
                    id: "sortAsc",
                    label: getGridMessage(gridMessageKeys.headerMenuSortAsc, defaultLocale),
                    disabled: !canSort,
                  },
                  {
                    id: "sortDesc",
                    label: getGridMessage(gridMessageKeys.headerMenuSortDesc, defaultLocale),
                    disabled: !canSort,
                  },
                  {
                    id: "clearSort",
                    label: getGridMessage(gridMessageKeys.headerMenuClearSort, defaultLocale),
                    disabled: !sorted,
                  },
                  {
                    id: "pinLeft",
                    label: getGridMessage(gridMessageKeys.headerMenuPinLeft, defaultLocale),
                    disabled: pinned === "left",
                  },
                  {
                    id: "pinRight",
                    label: getGridMessage(gridMessageKeys.headerMenuPinRight, defaultLocale),
                    disabled: pinned === "right",
                  },
                  {
                    id: "unpin",
                    label: getGridMessage(gridMessageKeys.headerMenuUnpin, defaultLocale),
                    disabled: !pinned,
                  },
                  {
                    id: "hide",
                    label: getGridMessage(gridMessageKeys.headerMenuHide, defaultLocale),
                    disabled: visibleBusinessColumnCount <= 1,
                  },
                  {
                    id: "resetWidth",
                    label: getGridMessage(gridMessageKeys.headerMenuResetWidth, defaultLocale),
                  },
                ]
              : [];

            const handleMenuAction = (action: GridHeaderMenuAction) => {
              switch (action) {
                case "sortAsc":
                  table.setSorting([{ id: headerColumn.id, desc: false }]);
                  break;
                case "sortDesc":
                  table.setSorting([{ id: headerColumn.id, desc: true }]);
                  break;
                case "clearSort":
                  table.setSorting([]);
                  break;
                case "pinLeft":
                  headerColumn.pin("left");
                  break;
                case "pinRight":
                  headerColumn.pin("right");
                  break;
                case "unpin":
                  headerColumn.pin(false);
                  break;
                case "hide":
                  headerColumn.toggleVisibility(false);
                  break;
                case "resetWidth":
                  headerColumn.resetSize();
                  break;
                default:
                  break;
              }

              closeMenu(true);
            };
            const headerLabel = (
              <span
                style={{
                  display: "inline-block",
                  flex: "1 1 auto",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </span>
            );

            return (
              <th
                key={header.id}
                data-testid={columnKey ? `header-cell-${columnKey}` : undefined}
                data-column-key={columnKey}
                data-column-pinned={pinned || "none"}
                data-column-filtered={isFiltered ? "true" : "false"}
                data-column-filter-count={filterCount}
                data-header-menu-open={isMenuOpen ? "true" : "false"}
                onContextMenu={
                  canShowMenu
                    ? (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setOpenColumnKey(columnKey);
                      }
                    : undefined
                }
                style={{
                  ...stickyStyle,
                  zIndex: isMenuOpen ? 40 : stickyStyle.zIndex,
                  overflow: "visible",
                  borderBottom: `1px solid ${vibeGridThemeTokens.header.borderColor}`,
                  color: vibeGridThemeTokens.header.textColor,
                  fontSize: 13,
                  fontWeight: 800,
                  padding: "0 16px",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  width: header.getSize(),
                  minWidth: header.getSize(),
                }}
              >
                <div
                  style={{
                    position: "relative",
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
                        minWidth: 0,
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        font: "inherit",
                        fontWeight: 800,
                        color: vibeGridThemeTokens.header.textColor,
                        cursor: "pointer",
                      }}
                    >
                      {headerLabel}
                    </button>
                  ) : (
                    headerLabel
                  )}

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        minWidth: 16,
                        textAlign: "center",
                        fontSize: 11,
                        color: sorted
                          ? vibeGridThemeTokens.indicator.sortedText
                          : vibeGridThemeTokens.indicator.idleText,
                      }}
                    >
                      {getSortIndicator(sorted)}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        minWidth: 16,
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        color: pinIndicator
                          ? vibeGridThemeTokens.indicator.pinnedText
                          : vibeGridThemeTokens.indicator.idleText,
                      }}
                    >
                      {pinIndicator ?? " "}
                    </span>
                    {canShowMenu ? (
                      <span
                        data-testid={`header-filter-indicator-${columnKey}`}
                        aria-hidden="true"
                        style={{
                          minWidth: 18,
                          height: 18,
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 6px",
                          background: isFiltered
                            ? vibeGridThemeTokens.indicator.filteredBackground
                            : "transparent",
                          color: isFiltered
                            ? vibeGridThemeTokens.indicator.filteredText
                            : vibeGridThemeTokens.indicator.idleText,
                          fontSize: 10,
                          fontWeight: 800,
                          border: isFiltered
                            ? `1px solid ${vibeGridThemeTokens.indicator.filteredBorder}`
                            : "1px solid transparent",
                        }}
                      >
                        {isFiltered ? filterCount : " "}
                      </span>
                    ) : null}
                    {canShowMenu ? (
                      <button
                        ref={(node) => {
                          if (columnKey) {
                            triggerRefs.current[columnKey] = node;
                          }
                        }}
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        data-testid={`header-menu-trigger-${columnKey}`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setOpenColumnKey((current) =>
                            current === columnKey ? undefined : columnKey,
                          );
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 10,
                          border: isMenuOpen
                            ? vibeGridThemeTokens.menu.triggerOpenBorder
                            : vibeGridThemeTokens.menu.triggerIdleBorder,
                          background: isMenuOpen
                            ? vibeGridThemeTokens.menu.triggerOpenBackground
                            : vibeGridThemeTokens.menu.triggerIdleBackground,
                          color: vibeGridThemeTokens.menu.textColor,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        ...
                      </button>
                    ) : (
                      <span style={{ width: 28, height: 28, display: "inline-block" }} />
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
                  {isMenuOpen && columnKey ? (
                    <VibeGridHeaderMenu
                      columnKey={columnKey}
                      items={menuItems}
                      onAction={handleMenuAction}
                    />
                  ) : null}
                </div>
              </th>
            );
          })}
        </tr>
      ))}
      {enableFilterRow ? (
        <VibeGridFilterRow
          table={table}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      ) : null}
    </thead>
  );
}
