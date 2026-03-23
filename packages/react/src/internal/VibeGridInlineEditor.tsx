import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  updateEditSessionDraft,
  type GridEditorSpec,
  type GridEditSession,
} from "@vibe-grid/core";
import { vibeGridThemeTokens } from "@vibe-grid/theme-shadcn";
import { VibeGridDateEditor } from "./VibeGridDateEditor";
import type { RowRecord } from "./vibe-grid-types";

type VibeGridInlineEditorProps<Row extends RowRecord> = {
  inputId: string;
  rowId: string;
  columnKey?: string;
  editor?: GridEditorSpec<Row>;
  row: Row;
  editSession: GridEditSession | null | undefined;
  onEditSessionChange?: (session: GridEditSession | null) => void;
  onCellEditCommit?: (input: {
    rowKey: string;
    columnKey: string;
    draftValue: string;
  }) => void;
};

export function VibeGridInlineEditor<Row extends RowRecord>({
  inputId,
  rowId,
  columnKey,
  editor,
  row,
  editSession,
  onEditSessionChange,
  onCellEditCommit,
}: VibeGridInlineEditorProps<Row>) {
  if (!editSession || !columnKey) {
    return null;
  }

  const commonStyle = {
    width: "100%",
    border: "none",
    borderRadius: 0,
    padding: 0,
    margin: 0,
    font: "inherit",
    fontSize: "inherit",
    fontWeight: "inherit",
    color: "inherit",
    background: "transparent",
    outline: "none",
  } as const;

  const commit = (draftValue = editSession.draftValue) => {
    onCellEditCommit?.({
      rowKey: rowId,
      columnKey,
      draftValue,
    });
  };

  const cancel = () => {
    onEditSessionChange?.(null);
  };

  const onKeyDown = (
    event: ReactKeyboardEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }

    if (editor?.type === "textarea") {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        commit();
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }
  };

  const commonProps = {
    id: `${inputId}-${rowId}-${columnKey}`,
    autoFocus: true,
    value: editSession.draftValue,
    onBlur: () => commit(),
    onClick: (event: React.MouseEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >) => {
      event.stopPropagation();
    },
    onMouseDown: (event: React.MouseEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >) => {
      event.stopPropagation();
    },
    style: commonStyle,
  } as const;

  if (editor?.type === "select") {
    const options =
      typeof editor.options === "function" ? editor.options(row) : editor.options;

    return (
      <select
        {...commonProps}
        data-testid={`inline-editor-${rowId}-${columnKey}`}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          onEditSessionChange?.(
            updateEditSessionDraft(editSession, event.target.value),
          );
          commit(event.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (editor?.type === "textarea") {
    return (
      <textarea
        {...commonProps}
        data-testid={`inline-editor-${rowId}-${columnKey}`}
        rows={editor.rows ?? 4}
        placeholder={editor.placeholder}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          onEditSessionChange?.(
            updateEditSessionDraft(editSession, event.target.value),
          );
        }}
        style={{
          ...commonStyle,
          resize: "none",
        }}
      />
    );
  }

  if (editor?.type === "number") {
    return (
      <input
        {...commonProps}
        data-testid={`inline-editor-${rowId}-${columnKey}`}
        type="number"
        min={editor.min}
        max={editor.max}
        step={editor.step}
        placeholder={editor.placeholder}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          onEditSessionChange?.(
            updateEditSessionDraft(editSession, event.target.value),
          );
        }}
      />
    );
  }

  if (editor?.type === "date") {
    return (
      <VibeGridDateEditor
        inputId={inputId}
        rowId={rowId}
        columnKey={columnKey}
        editor={editor}
        row={row}
        editSession={editSession}
        onEditSessionChange={onEditSessionChange}
        onCellEditCommit={onCellEditCommit}
      />
    );
  }

  return (
    <input
      {...commonProps}
      data-testid={`inline-editor-${rowId}-${columnKey}`}
      type="text"
      placeholder={editor?.placeholder}
      onKeyDown={onKeyDown}
      onChange={(event) => {
        onEditSessionChange?.(
          updateEditSessionDraft(editSession, event.target.value),
        );
      }}
    />
  );
}
