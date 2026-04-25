import assert from "node:assert/strict";
import test from "node:test";
import type { GridColumnState } from "@vibe-grid/core";
import {
  createBrowserGridPreferenceAdapter,
  createGridPreferenceStorageKey,
  type GridPreferenceStorage,
} from "./index";

class MemoryStorage implements GridPreferenceStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function createColumnState(order: string[]): GridColumnState {
  return {
    order,
    visibility: Object.fromEntries(order.map((key) => [key, true])),
    sizing: {},
    pinning: {
      left: [],
      right: [],
    },
  };
}

test("createGridPreferenceStorageKey sanitizes unsafe scope segments", () => {
  const key = createGridPreferenceStorageKey({
    namespace: " vibe/grid! ",
    appId: " ehr hr ",
    userId: "kim/min seok",
    gridId: "payroll#main",
  });

  assert.equal(key, "vibe-grid-:ehr-hr:kim-min-seok:payroll-main:column-state");
});

test("createBrowserGridPreferenceAdapter isolates column state by user scope", () => {
  const storage = new MemoryStorage();
  const adapter = createBrowserGridPreferenceAdapter(storage);
  const firstScope = {
    appId: "ehr",
    gridId: "employees",
    userId: "user-a",
  };
  const secondScope = {
    appId: "ehr",
    gridId: "employees",
    userId: "user-b",
  };

  adapter.setColumnState(firstScope, createColumnState(["employeeId", "name"]));
  adapter.setColumnState(secondScope, createColumnState(["name", "employeeId"]));

  assert.deepEqual(adapter.getColumnState(firstScope)?.order, [
    "employeeId",
    "name",
  ]);
  assert.deepEqual(adapter.getColumnState(secondScope)?.order, [
    "name",
    "employeeId",
  ]);

  adapter.clearColumnState(firstScope);

  assert.equal(adapter.getColumnState(firstScope), null);
  assert.deepEqual(adapter.getColumnState(secondScope)?.order, [
    "name",
    "employeeId",
  ]);
});

test("getColumnState returns null for invalid JSON payloads", () => {
  const storage = new MemoryStorage();
  const adapter = createBrowserGridPreferenceAdapter(storage);
  const scope = {
    appId: "ehr",
    gridId: "employees",
  };

  storage.setItem(adapter.getColumnStateKey(scope), "{not-valid-json");

  assert.equal(adapter.getColumnState(scope), null);
});
