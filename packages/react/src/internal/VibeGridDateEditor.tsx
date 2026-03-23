import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  updateEditSessionDraft,
  type GridDateBadge,
  type GridEditSession,
  type GridEditorSpec,
} from "@vibe-grid/core";
import type { VibeGridThemeTokens } from "@vibe-grid/theme-shadcn";
import type { RowRecord } from "./vibe-grid-types";

type DateEditorSpec<Row extends RowRecord> = Extract<
  GridEditorSpec<Row>,
  { type: "date" }
>;

type VibeGridDateEditorProps<Row extends RowRecord> = {
  inputId: string;
  rowId: string;
  columnKey: string;
  editor: DateEditorSpec<Row>;
  row: Row;
  editSession: GridEditSession;
  onEditSessionChange?: (session: GridEditSession | null) => void;
  onCellEditCommit?: (input: {
    rowKey: string;
    columnKey: string;
    draftValue: string;
  }) => void;
  theme: VibeGridThemeTokens;
};

type CalendarCell = {
  isoDate: string;
  dayLabel: string;
  inMonth: boolean;
  disabled: boolean;
  badge?: GridDateBadge;
};

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseIsoDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function addDays(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
}

function buildCalendarCells<Row extends RowRecord>(
  monthDate: Date,
  editor: DateEditorSpec<Row>,
  row: Row,
) {
  const firstDay = startOfMonth(monthDate);
  const gridStart = addDays(firstDay, firstDay.getDay() * -1);

  return Array.from({ length: 42 }, (_, index) => {
    const day = addDays(gridStart, index);
    const isoDate = formatIsoDate(day);
    const beforeMin = editor.minDate ? isoDate < editor.minDate : false;
    const afterMax = editor.maxDate ? isoDate > editor.maxDate : false;
    const disabledByRule = editor.disabledDate?.(isoDate, row) ?? false;

    return {
      isoDate,
      dayLabel: String(day.getDate()),
      inMonth: day.getMonth() === monthDate.getMonth(),
      disabled: beforeMin || afterMax || disabledByRule,
      badge: editor.dateBadge?.(isoDate, row),
    } satisfies CalendarCell;
  });
}

function getBadgeStyle(badge: GridDateBadge | undefined) {
  if (badge === "holiday") {
    return {
      background: "#fef2f2",
      color: "#b91c1c",
      borderColor: "rgba(185, 28, 28, 0.18)",
    };
  }

  if (badge === "special") {
    return {
      background: "#fff7ed",
      color: "#c2410c",
      borderColor: "rgba(194, 65, 12, 0.18)",
    };
  }

  if (badge === "weekend") {
    return {
      background: "#eff6ff",
      color: "#1d4ed8",
      borderColor: "rgba(29, 78, 216, 0.18)",
    };
  }

  return {
    background: "transparent",
    color: "inherit",
    borderColor: "transparent",
  };
}

export function VibeGridDateEditor<Row extends RowRecord>({
  inputId,
  rowId,
  columnKey,
  editor,
  row,
  editSession,
  onEditSessionChange,
  onCellEditCommit,
  theme,
}: VibeGridDateEditorProps<Row>) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(parseIsoDate(editSession.draftValue) ?? new Date()),
  );

  useEffect(() => {
    const draftDate = parseIsoDate(editSession.draftValue);
    if (draftDate) {
      setViewMonth(startOfMonth(draftDate));
    }
  }, [editSession.draftValue]);

  const cells = useMemo(
    () => buildCalendarCells(viewMonth, editor, row),
    [editor, row, viewMonth],
  );
  const monthLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(viewMonth);

  const commit = (draftValue = editSession.draftValue) => {
    onCellEditCommit?.({
      rowKey: rowId,
      columnKey,
      draftValue,
    });
  };

  const cancel = () => {
    setIsOpen(false);
    onEditSessionChange?.(null);
  };

  const handleBlur = (
    event: FocusEvent<HTMLDivElement | HTMLInputElement | HTMLButtonElement>,
  ) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && wrapperRef.current?.contains(nextTarget)) {
      return;
    }

    setIsOpen(false);
    commit();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }
  };

  const keepFocusInside = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div
      ref={wrapperRef}
      onBlur={handleBlur}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
      style={{
        position: "relative",
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 8,
        }}
      >
        <input
          id={`${inputId}-${rowId}-${columnKey}`}
          data-testid={`inline-editor-${rowId}-${columnKey}`}
          type="date"
          autoFocus
          min={editor.minDate}
          max={editor.maxDate}
          value={editSession.draftValue}
          placeholder={editor.placeholder}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            onEditSessionChange?.(
              updateEditSessionDraft(editSession, event.target.value),
            );
          }}
          style={{
            width: "100%",
            border: `1px solid ${theme.editor.borderColor}`,
            borderRadius: theme.editor.borderRadius,
            padding: "8px 10px",
            font: "inherit",
            background: theme.editor.background,
          }}
        />
        <button
          type="button"
          data-testid={`date-editor-toggle-${rowId}-${columnKey}`}
          aria-label="Toggle calendar"
          onMouseDown={keepFocusInside}
          onClick={() => {
            setIsOpen((previous) => !previous);
          }}
          style={calendarChromeButtonStyle}
        >
          Cal
        </button>
      </div>

      {isOpen ? (
        <div
          data-testid={`date-editor-popover-${rowId}-${columnKey}`}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 30,
            marginTop: 8,
            minWidth: 280,
            border: `1px solid ${theme.menu.borderColor}`,
            borderRadius: 16,
            background: theme.menu.background,
            boxShadow: theme.menu.shadow,
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <button
              type="button"
              onMouseDown={keepFocusInside}
              onClick={() => setViewMonth((previous) => addMonths(previous, -1))}
              style={calendarChromeButtonStyle}
            >
              Prev
            </button>
            <strong style={{ color: "#0f172a", fontSize: 14 }}>{monthLabel}</strong>
            <button
              type="button"
              onMouseDown={keepFocusInside}
              onClick={() => setViewMonth((previous) => addMonths(previous, 1))}
              style={calendarChromeButtonStyle}
            >
              Next
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 6,
              marginTop: 12,
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              textAlign: "center",
            }}
          >
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 6,
              marginTop: 10,
            }}
          >
            {cells.map((cell) => {
              const isSelected = editSession.draftValue === cell.isoDate;
              const badgeStyle = getBadgeStyle(cell.badge);

              return (
                <button
                  key={cell.isoDate}
                  type="button"
                  data-testid={`date-editor-day-${cell.isoDate}`}
                  disabled={cell.disabled}
                  aria-pressed={isSelected}
                  onMouseDown={keepFocusInside}
                  onClick={() => {
                    onEditSessionChange?.(
                      updateEditSessionDraft(editSession, cell.isoDate),
                    );
                    setIsOpen(false);
                    commit(cell.isoDate);
                  }}
                  style={{
                    minHeight: 34,
                    borderRadius: 12,
                    border: `1px solid ${
                      isSelected ? "#0ea5e9" : badgeStyle.borderColor
                    }`,
                    background: isSelected
                      ? "#e0f2fe"
                      : cell.inMonth
                        ? badgeStyle.background
                        : "#f8fafc",
                    color: cell.disabled
                      ? "#94a3b8"
                      : badgeStyle.color === "inherit"
                        ? "#0f172a"
                        : badgeStyle.color,
                    fontSize: 12,
                    fontWeight: isSelected ? 800 : 600,
                    cursor: cell.disabled ? "not-allowed" : "pointer",
                    opacity: cell.inMonth ? 1 : 0.6,
                  }}
                >
                  {cell.dayLabel}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
            }}
          >
            <button
              type="button"
              onMouseDown={keepFocusInside}
              onClick={() => {
                onEditSessionChange?.(updateEditSessionDraft(editSession, ""));
                setIsOpen(false);
                commit("");
              }}
              style={calendarChromeButtonStyle}
            >
              Clear
            </button>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <LegendChip label="Weekend" badge="weekend" />
              <LegendChip label="Holiday" badge="holiday" />
              <LegendChip label="Special" badge="special" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LegendChip(input: { label: string; badge: GridDateBadge }) {
  const badgeStyle = getBadgeStyle(input.badge);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        border: `1px solid ${badgeStyle.borderColor}`,
        background: badgeStyle.background,
        color: badgeStyle.color,
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 8px",
      }}
    >
      {input.label}
    </span>
  );
}

const calendarChromeButtonStyle = {
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: 10,
  background: "#fff",
  color: "#334155",
  fontSize: 12,
  fontWeight: 700,
  padding: "6px 10px",
  cursor: "pointer",
} as const;
