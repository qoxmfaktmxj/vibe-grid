import type { CSSProperties } from "react";
import { defaultLocale, getGridMessage, gridMessageKeys } from "@vibe-grid/i18n";
import { vibeGridThemeTokens } from "@vibe-grid/theme-shadcn";

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
};

const menuStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% - 4px)",
  right: 0,
  minWidth: 180,
  padding: 8,
  borderRadius: 16,
  border: `1px solid ${vibeGridThemeTokens.menu.borderColor}`,
  background: vibeGridThemeTokens.menu.background,
  boxShadow: vibeGridThemeTokens.menu.shadow,
  backdropFilter: "blur(10px)",
  zIndex: 30,
};

const menuItemStyle: CSSProperties = {
  width: "100%",
  border: "none",
  background: "transparent",
  borderRadius: 12,
  padding: "10px 12px",
  textAlign: "left",
  font: "inherit",
  fontSize: 13,
  fontWeight: 700,
  color: vibeGridThemeTokens.header.textColor,
  cursor: "pointer",
};

const disabledMenuItemStyle: CSSProperties = {
  ...menuItemStyle,
  color: "#94a3b8",
  cursor: "not-allowed",
};

export function VibeGridHeaderMenu({
  columnKey,
  items,
  onAction,
}: VibeGridHeaderMenuProps) {
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
          style={item.disabled ? disabledMenuItemStyle : menuItemStyle}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
