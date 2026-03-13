import type { CSSProperties } from "react";

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
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "rgba(255,255,255,0.98)",
  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.16)",
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
  color: "#0f172a",
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
      aria-label={`${columnKey} header menu`}
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
