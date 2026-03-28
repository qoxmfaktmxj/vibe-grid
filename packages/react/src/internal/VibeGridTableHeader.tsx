import type { GridFilter } from "@vibe-grid/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { defaultLocale, getGridMessage, gridMessageKeys } from "@vibe-grid/i18n";
import type { VibeGridThemeTokens } from "@vibe-grid/theme-shadcn";
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
  theme: VibeGridThemeTokens;
};

function getSortIndicator(sorted: false | "asc" | "desc") {
  if (sorted === "asc") {
    return "▲";
  }

  if (sorted === "desc") {
    return "▼";
  }

  return "";
}

function getPinIndicator(pinState: false | "left" | "right") {
  if (pinState === "left") {
    return "◀";
  }

  if (pinState === "right") {
    return "▶";
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
  theme,
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
            const isSimpleInternalHeader =
              headerMeta?.internalControl === "rowCheck" ||
              headerMeta?.internalControl === "deleteCheck";
            const pinIndicator = getPinIndicator(pinned);
            const filterCount = getColumnFilterCount(columnKey, filters);
            const isFiltered = filterCount > 0;
            const showIndicators = !headerMeta?.internal;
            const background = isMenuOpen
              ? theme.header.menuOpenBackground
              : pinned
                ? theme.header.pinnedBackground
                : isFiltered
                  ? theme.header.filteredBackground
                  : sorted
                    ? theme.header.sortedBackground
                    : theme.header.idleBackground;
            const stickyStyle = getStickyCellStyle(headerColumn, background, true, false, theme);

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
            const simpleHeaderContent = header.isPlaceholder ? null : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 22,
                  width: "100%",
                }}
              >
                {headerLabel}
              </div>
            );
            const headerTextColor = (sorted || isFiltered)
              ? theme.header.activeTextColor
              : theme.header.textColor;
            return (
              <th
                key={header.id}
                className="vg-header-cell"
                data-testid={columnKey ? `header-cell-${columnKey}` : undefined}
                data-column-key={columnKey}
                data-column-pinned={pinned || "none"}
                data-column-filtered={isFiltered ? "true" : "false"}
                data-column-filter-count={filterCount}
                data-column-width={header.getSize()}
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
                  borderBottom: `1px solid ${theme.header.borderColor}`,
                  color: headerTextColor,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  padding: "10px 16px",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  width: header.getSize(),
                  minWidth: header.getSize(),
                }}
              >
                {isSimpleInternalHeader ? (
                  simpleHeaderContent
                ) : (
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    minHeight: 22,
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
                        fontWeight: 600,
                        color: headerTextColor,
                        cursor: "pointer",
                        letterSpacing: "0.01em",
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
                    {showIndicators && sorted ? (
                      <span
                        aria-hidden="true"
                        style={{
                          minWidth: 14,
                          textAlign: "center",
                          fontSize: 9,
                          fontWeight: 600,
                          color: theme.indicator.sortedText,
                          lineHeight: 1,
                        }}
                      >
                        {getSortIndicator(sorted)}
                      </span>
                    ) : null}
                    {showIndicators && pinIndicator ? (
                      <span
                        aria-hidden="true"
                        style={{
                          minWidth: 14,
                          textAlign: "center",
                          fontSize: 9,
                          fontWeight: 600,
                          color: theme.indicator.pinnedText,
                          lineHeight: 1,
                        }}
                      >
                        {pinIndicator}
                      </span>
                    ) : null}
                    {canShowMenu && isFiltered ? (
                      <span
                        data-testid={`header-filter-indicator-${columnKey}`}
                        aria-hidden="true"
                        style={{
                          minWidth: 16,
                          height: 18,
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 6px",
                          background: theme.indicator.filteredBackground,
                          color: theme.indicator.filteredText,
                          fontSize: 10,
                          fontWeight: 600,
                          border: `1px solid ${theme.indicator.filteredBorder}`,
                          lineHeight: 1,
                        }}
                      >
                        {filterCount}
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
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          border: isMenuOpen
                            ? theme.menu.triggerOpenBorder
                            : theme.menu.triggerIdleBorder,
                          background: isMenuOpen
                            ? theme.menu.triggerOpenBackground
                            : theme.menu.triggerIdleBackground,
                          color: theme.menu.textColor,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          lineHeight: 1,
                        }}
                      >
                        ⋯
                      </button>
                    ) : (
                      <span style={{ width: 24, height: 24, display: "inline-block" }} />
                    )}
                    {headerColumn.getCanResize() ? (
                      <div
                        data-testid={
                          columnKey ? `header-resize-handle-${columnKey}` : undefined
                        }
                        className="vg-resize-handle"
                        onDoubleClick={() => headerColumn.resetSize()}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        style={{
                          width: 8,
                          height: 28,
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
                            height: 16,
                            borderRadius: 999,
                            background:
                              pinned && sorted
                                ? theme.header.resizeHandlePinnedSorted
                                : theme.header.resizeHandleIdle,
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
                      theme={theme}
                    />
                  ) : null}
                </div>
                )}
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
          theme={theme}
        />
      ) : null}
    </thead>
  );
}
