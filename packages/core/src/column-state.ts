import type {
  GridColumnSizingState,
  GridColumnState,
  GridColumnVisibilityState,
  VibeGridColumn,
} from "./contracts";

type RowRecord = Record<string, unknown>;

function clampWidth(width: number) {
  return Math.max(80, Math.min(480, Math.round(width)));
}

export function createGridColumnState<Row extends RowRecord>(
  columns: ReadonlyArray<VibeGridColumn<Row>>,
): GridColumnState {
  return {
    order: columns.map((column) => column.key),
    visibility: Object.fromEntries(
      columns.map((column) => [column.key, column.hidden !== true]),
    ) as GridColumnVisibilityState,
    sizing: Object.fromEntries(
      columns
        .filter((column) => typeof column.width === "number")
        .map((column) => [column.key, clampWidth(column.width ?? 140)]),
    ) as GridColumnSizingState,
    pinning: {
      left: columns
        .filter((column) => column.pin === "left")
        .map((column) => column.key),
      right: columns
        .filter((column) => column.pin === "right")
        .map((column) => column.key),
    },
  };
}

export function sanitizeGridColumnState<Row extends RowRecord>(
  columns: ReadonlyArray<VibeGridColumn<Row>>,
  state?: GridColumnState,
): GridColumnState {
  const fallback = createGridColumnState(columns);
  if (!state) {
    return fallback;
  }

  const validKeys = new Set(columns.map((column) => column.key));
  const order = [
    ...state.order.filter((key) => validKeys.has(key)),
    ...fallback.order.filter((key) => !state.order.includes(key)),
  ];

  const visibility = { ...fallback.visibility };
  Object.entries(state.visibility).forEach(([key, value]) => {
    if (validKeys.has(key)) {
      visibility[key] = value;
    }
  });

  const sizing = { ...fallback.sizing };
  Object.entries(state.sizing).forEach(([key, value]) => {
    if (validKeys.has(key) && Number.isFinite(value)) {
      sizing[key] = clampWidth(value);
    }
  });

  const normalizePinList = (keys: string[]) =>
    keys.filter((key, index) => validKeys.has(key) && keys.indexOf(key) === index);

  const left = normalizePinList(state.pinning.left);
  const right = normalizePinList(
    state.pinning.right.filter((key) => !left.includes(key)),
  );

  return {
    order,
    visibility,
    sizing,
    pinning: { left, right },
  };
}

export function setGridColumnVisibility(
  state: GridColumnState,
  columnKey: string,
  visible: boolean,
): GridColumnState {
  return {
    ...state,
    visibility: {
      ...state.visibility,
      [columnKey]: visible,
    },
  };
}

export function moveGridColumn(
  state: GridColumnState,
  columnKey: string,
  direction: "left" | "right",
): GridColumnState {
  const currentIndex = state.order.indexOf(columnKey);
  if (currentIndex < 0) {
    return state;
  }

  const targetIndex =
    direction === "left"
      ? Math.max(0, currentIndex - 1)
      : Math.min(state.order.length - 1, currentIndex + 1);

  if (targetIndex === currentIndex) {
    return state;
  }

  const nextOrder = [...state.order];
  nextOrder.splice(currentIndex, 1);
  nextOrder.splice(targetIndex, 0, columnKey);

  return {
    ...state,
    order: nextOrder,
  };
}

export function setGridColumnPinning(
  state: GridColumnState,
  columnKey: string,
  pin: "left" | "right" | false,
): GridColumnState {
  const left = state.pinning.left.filter((key) => key !== columnKey);
  const right = state.pinning.right.filter((key) => key !== columnKey);

  if (pin === "left") {
    left.push(columnKey);
  }

  if (pin === "right") {
    right.push(columnKey);
  }

  return {
    ...state,
    pinning: { left, right },
  };
}

export function setGridColumnWidth(
  state: GridColumnState,
  columnKey: string,
  width: number,
): GridColumnState {
  return {
    ...state,
    sizing: {
      ...state.sizing,
      [columnKey]: clampWidth(width),
    },
  };
}
