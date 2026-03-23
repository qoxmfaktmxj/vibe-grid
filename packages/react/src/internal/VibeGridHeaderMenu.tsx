import type { CSSProperties } from "react";
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

function getMenuStyle(theme: VibeGridThemeTokens): CSSProperties {
  return {
    position: "absolute",
    top: "calc(100% - 4px)",
    right: 0,
    minWidth: 196,
    padding: 10,
    borderRadius: 18,
    border: `1px solid ${theme.menu.borderColor}`,
    background: theme.menu.background,
    boxShadow: theme.menu.shadow,
    backdropFilter: "blur(20px)",
    zIndex: 30,
  };
}

function getMenuItemStyle(theme: VibeGridThemeTokens): CSSProperties {
  return {
    width: "100%",
    border: "none",
    background: "transparent",
    borderRadius: 14,
    padding: "11px 14px",
    textAlign: "left",
    font: "inherit",
    fontSize: 12,
    fontWeight: 700,
    color: theme.menu.textColor,
    cursor: "pointer",
  };
}

function getDisabledMenuItemStyle(theme: VibeGridThemeTokens): CSSProperties {
  return {
    ...getMenuItemStyle(theme),
    color: "#94a3b8",
    cursor: "not-allowed",
  };
}

export function VibeGridHeaderMenu({
  columnKey,
  items,
  onAction,
  theme,
}: VibeGridHeaderMenuProps) {
  const menuStyle = getMenuStyle(theme);
  const menuItemStyle = getMenuItemStyle(theme);
  const disabledStyle = getDisabledMenuItemStyle(theme);

  return (
    <div
      role="menu"
      aria-label={`${columnKey} ${getGridMessage(gridMessageKeys.headerMenuAriaLabel, defaultLocale)}`}
      data-testid={`header-menu-${columnKey}`}
      style={menuStyle}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          data-testid={`header-menu-action-${columnKey}-${item.id}`}
          disabled={item.disabled}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            if (!item.disabled) {
              onAction(item.id);
            }
          }}
          style={item.disabled ? disabledStyle : menuItemStyle}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
