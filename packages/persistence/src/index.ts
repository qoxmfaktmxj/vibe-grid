import type { GridColumnState } from "@vibe-grid/core";

export type GridPreferenceScope = {
  appId: string;
  gridId: string;
  userId?: string;
  namespace?: string;
};

export type GridPreferenceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type GridPreferenceAdapter = {
  getColumnState: (scope: GridPreferenceScope) => GridColumnState | null;
  setColumnState: (scope: GridPreferenceScope, state: GridColumnState) => void;
  clearColumnState: (scope: GridPreferenceScope) => void;
  getColumnStateKey: (scope: GridPreferenceScope) => string;
};

const DEFAULT_NAMESPACE = "vibe-grid";
const COLUMN_STATE_SEGMENT = "column-state";
const DEFAULT_USER_ID = "anonymous";

function sanitizeSegment(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9:_-]+/g, "-");
}

export function createGridPreferenceStorageKey(
  scope: GridPreferenceScope,
  segment = COLUMN_STATE_SEGMENT,
) {
  const namespace = sanitizeSegment(scope.namespace ?? DEFAULT_NAMESPACE);
  const appId = sanitizeSegment(scope.appId);
  const gridId = sanitizeSegment(scope.gridId);
  const userId = sanitizeSegment(scope.userId ?? DEFAULT_USER_ID);

  return [namespace, appId, userId, gridId, segment].join(":");
}

export function createBrowserGridPreferenceAdapter(
  storage: GridPreferenceStorage,
): GridPreferenceAdapter {
  return {
    getColumnState(scope) {
      const raw = storage.getItem(createGridPreferenceStorageKey(scope));

      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw) as GridColumnState;
      } catch {
        return null;
      }
    },
    setColumnState(scope, state) {
      storage.setItem(
        createGridPreferenceStorageKey(scope),
        JSON.stringify(state),
      );
    },
    clearColumnState(scope) {
      storage.removeItem(createGridPreferenceStorageKey(scope));
    },
    getColumnStateKey(scope) {
      return createGridPreferenceStorageKey(scope);
    },
  };
}
