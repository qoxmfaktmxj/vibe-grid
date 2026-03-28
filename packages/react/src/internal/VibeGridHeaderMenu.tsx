import { useState, type CSSProperties } from "react";
import { defaultLocale, getGridMessage, gridMessageKeys } from "@vibe-grid/i18n";
import type { VibeGridThemeTokens } from "@vibe-grid/theme-shadcn";

export type GridHeaderMenuAction =
  | "sortAsc"
  | "sortDesc"
  | "clearSort"
  | "pinLeft"
  | "pinRight"
  | "unpin"
  | "hide"
  | "resetWidth";

export type MenuActionItem = {
  id: GridHeaderMenuAction;
  label: string;
  disabled?: boolean;
};

type VibeGridHeaderMenuProps = {
  columnKey: string;
  items: MenuActionItem[];
  onAction: (action: GridHeaderMenuAction) => void;
  theme: VibeGridThemeTokens;
};

const SORT_ACTIONS = new Set<string>(["sortAsc", "sortDesc", "clearSort"]);
const PIN_ACTIONS = new Set<string>(["pinLeft", "pinRight", "unpin"]);

function getGroupIndex(id: string): number {
  if (SORT_ACTIONS.has(id)) return 0;
  if (PIN_ACTIONS.has(id)) return 1;
  return 2;
}

function getMenuStyle(theme: VibeGridThemeTokens): CSSProperties {
  return {
    position: "absolute",
    top: "calc(100% + 2px)",
    right: 0,
    minWidth: 180,
    padding: "6px",
    borderRadius: 12,
    border: `1px solid ${theme.menu.borderColor}`,
    background: theme.menu.background,
    boxShadow: theme.menu.shadow,
    backdropFilter: "blur(20px)",
    zIndex: 30,
  };
}

function getDividerStyle(theme: VibeGridThemeTokens): CSSProperties {
  return {
    height: 1,
    margin: "4px 8px",
    background: theme.menu.borderColor,
  };
}

export function VibeGridHeaderMenu({
  columnKey,
  items,
  onAction,
  theme,
}: VibeGridHeaderMenuProps) {
  const menuStyle = getMenuStyle(theme);
  const dividerStyle = getDividerStyle(theme);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      role="menu"
      aria-label={`${columnKey} ${getGridMessage(gridMessageKeys.headerMenuAriaLabel, defaultLocale)}`}
      data-testid={`header-menu-${columnKey}`}
      style={menuStyle}
    >
      {items.map((item, index) => {
        const prevGroup = index > 0 ? getGroupIndex(items[index - 1].id) : -1;
        const currentGroup = getGroupIndex(item.id);
        const showDivider = index > 0 && currentGroup !== prevGroup;
        const isHovered = hoveredId === item.id && !item.disabled;

        return (
          <div key={item.id}>
            {showDivider ? <div style={dividerStyle} /> : null}
            <button
              type="button"
              role="menuitem"
              data-testid={`header-menu-action-${columnKey}-${item.id}`}
              disabled={item.disabled}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                if (!item.disabled) {
                  onAction(item.id);
                }
              }}
              style={{
                width: "100%",
                border: "none",
                background: isHovered ? theme.menu.itemHoverBackground : "transparent",
                borderRadius: 8,
                padding: "8px 12px",
                textAlign: "left",
                font: "inherit",
                fontSize: 12,
                fontWeight: 500,
                color: item.disabled ? theme.menu.itemDisabledColor : theme.menu.textColor,
                cursor: item.disabled ? "not-allowed" : "pointer",
                transition: "background 0.1s",
              }}
            >
              {item.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
