export type SupportedLocale = "ko-KR" | "en-US";

export type RowState = "N" | "I" | "U" | "D";

export type GridCommandId =
  | "search"
  | "insert"
  | "copyRow"
  | "toggleDelete"
  | "save"
  | "exportExcel"
  | "downloadTemplate"
  | "importExcel";

export type GridCommandScope = "grid" | "host" | "excel";

export type GridFilter = {
  field: string;
  op: string;
  value: unknown;
};

export type GridSortRule = {
  id: string;
  desc: boolean;
};

export type GridQuery = {
  pageIndex: number;
  pageSize: number;
  sorting: GridSortRule[];
  filters: GridFilter[];
};

export type GridPageSnapshot = {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
};

export type GridServerResult<Row> = GridPageSnapshot & {
  rows: Row[];
  query: GridQuery;
};

export type GridActiveCell = {
  rowKey: string;
  columnKey: string;
};

export type GridCellRangeSelection = {
  anchor: GridActiveCell;
  focus: GridActiveCell;
};

export type GridSelectionMode = "row" | "range";

export type GridSelectionState = {
  activeRowId?: string;
  selectedRowIds: Set<string>;
  activeCell?: GridActiveCell;
  range?: GridCellRangeSelection;
  mode?: GridSelectionMode;
};

export type GridColumnVisibilityState = Record<string, boolean>;

export type GridColumnSizingState = Record<string, number>;

export type GridColumnPinningState = {
  left: string[];
  right: string[];
};

export type GridColumnState = {
  order: string[];
  visibility: GridColumnVisibilityState;
  sizing: GridColumnSizingState;
  pinning: GridColumnPinningState;
};

export type GridEditorOption = {
  label: string;
  value: string;
};

export type GridFilterEditorSpec =
  | {
      type?: "text";
      placeholder?: string;
      op?: "contains" | "eq";
    }
  | {
      type: "number";
      placeholder?: string;
      op?: "eq" | "gte" | "lte";
    }
  | {
      type: "select";
      options: GridEditorOption[];
      placeholder?: string;
      emptyLabel?: string;
      op?: "eq";
    };

export type GridEditorSpec<Row> =
  | {
      type?: "text";
      placeholder?: string;
    }
  | {
      type: "number";
      min?: number;
      max?: number;
      step?: number;
      placeholder?: string;
    }
  | {
      type: "textarea";
      rows?: number;
      placeholder?: string;
    }
  | {
      type: "select";
      options:
        | GridEditorOption[]
        | ((row: Row) => GridEditorOption[]);
      placeholder?: string;
    };

export type GridValidator<Row> = (
  value: unknown,
  row: Row,
) => string | null | undefined;

export type GridInputParser<Row> = (
  value: string,
  row: Row,
) => unknown;

export type VibeGridColumn<Row> = {
  key: string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  pin?: "left" | "right";
  sortable?: boolean;
  filterable?: boolean;
  filterEditor?: GridFilterEditorSpec;
  editable?: boolean;
  hidden?: boolean;
  required?: boolean;
  meta?: Record<string, unknown>;
  accessor?: (row: Row) => unknown;
  parse?: GridInputParser<Row>;
  validate?: GridValidator<Row>[];
  editor?: GridEditorSpec<Row>;
};

export type SaveBundle<Row> = {
  inserted: Row[];
  updated: Array<{
    rowKey: string;
    changes: Partial<Row>;
    original?: Partial<Row>;
  }>;
  deleted: Array<{
    rowKey: string;
    original?: Partial<Row>;
  }>;
};

export type GridMutationSource =
  | "load"
  | "insert"
  | "edit"
  | "copy"
  | "paste"
  | "import"
  | "deleteToggle"
  | "save";

export type GridValidationErrors<Row extends Record<string, unknown>> = Partial<
  Record<Extract<keyof Row, string>, string[]>
>;

export type GridRowMeta<Row extends Record<string, unknown>> = {
  rowKey: string;
  state: RowState;
  original?: Row;
  dirtyFields: Set<string>;
  validationErrors?: GridValidationErrors<Row>;
  copiedFrom?: string;
  lastMutationSource?: GridMutationSource;
};

export type GridEditSession = {
  rowKey: string;
  columnKey: string;
  draftValue: string;
  startedAt: number;
};

export type ManagedGridRow<Row extends Record<string, unknown>> = {
  row: Row;
  meta: GridRowMeta<Row>;
};

export type GridCommandContext<Row extends Record<string, unknown>> = {
  rows: ManagedGridRow<Row>[];
  selection: GridSelectionState;
  query?: GridQuery;
};

export type GridCommand<
  Row extends Record<string, unknown> = Record<string, unknown>,
> = {
  id: GridCommandId;
  legacyCode?: string;
  labelKey: string;
  label: string;
  scope: GridCommandScope;
  hotkey?: string;
  execute?: (context: GridCommandContext<Row>) => Promise<void> | void;
};

export type GridStateCounts = Record<RowState, number>;

export type GridScaffoldStatus = {
  phase: string;
  engine: string;
  contractOwner: string;
  targetUx: string;
};
