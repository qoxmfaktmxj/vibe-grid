import type { GridCommand, GridCommandId, SupportedLocale } from "./contracts";

type GridCommandCatalogEntry = Omit<GridCommand, "label"> & {
  labels: Record<SupportedLocale, string>;
};

const GRID_COMMAND_CATALOG: Record<GridCommandId, GridCommandCatalogEntry> = {
  search: {
    id: "search",
    legacyCode: "IBSEARCH",
    labelKey: "grid.command.search",
    labels: {
      "ko-KR": "조회",
      "en-US": "Search",
    },
    scope: "host",
    hotkey: "F8",
  },
  insert: {
    id: "insert",
    legacyCode: "IBINSERT",
    labelKey: "grid.command.insert",
    labels: {
      "ko-KR": "입력",
      "en-US": "Insert",
    },
    scope: "grid",
    hotkey: "Alt+I",
  },
  copyRow: {
    id: "copyRow",
    legacyCode: "IBCOPYROW",
    labelKey: "grid.command.copyRow",
    labels: {
      "ko-KR": "복사",
      "en-US": "Copy Row",
    },
    scope: "grid",
    hotkey: "Alt+C",
  },
  toggleDelete: {
    id: "toggleDelete",
    legacyCode: "IBDELETE",
    labelKey: "grid.command.toggleDelete",
    labels: {
      "ko-KR": "삭제",
      "en-US": "Delete",
    },
    scope: "grid",
    hotkey: "Delete",
  },
  save: {
    id: "save",
    legacyCode: "IBSAVE",
    labelKey: "grid.command.save",
    labels: {
      "ko-KR": "저장",
      "en-US": "Save",
    },
    scope: "host",
    hotkey: "Ctrl+S",
  },
  exportExcel: {
    id: "exportExcel",
    legacyCode: "IBDOWNEXCEL",
    labelKey: "grid.command.exportExcel",
    labels: {
      "ko-KR": "엑셀 다운로드",
      "en-US": "Export Excel",
    },
    scope: "excel",
  },
  downloadTemplate: {
    id: "downloadTemplate",
    legacyCode: "IBDOWNEXCEL_SAMPLE",
    labelKey: "grid.command.downloadTemplate",
    labels: {
      "ko-KR": "엑셀 양식 다운로드",
      "en-US": "Download Template",
    },
    scope: "excel",
  },
  importExcel: {
    id: "importExcel",
    legacyCode: "IBLOADEXCEL",
    labelKey: "grid.command.importExcel",
    labels: {
      "ko-KR": "엑셀 업로드",
      "en-US": "Import Excel",
    },
    scope: "excel",
  },
};

export const GRID_COMMAND_IDS = Object.freeze(
  Object.keys(GRID_COMMAND_CATALOG) as GridCommandId[],
);

export function createDefaultCommandRegistry(
  locale: SupportedLocale = "ko-KR",
): GridCommand[] {
  return GRID_COMMAND_IDS.map((commandId) => {
    const command = GRID_COMMAND_CATALOG[commandId];

    return {
      id: command.id,
      legacyCode: command.legacyCode,
      labelKey: command.labelKey,
      label: command.labels[locale],
      scope: command.scope,
      hotkey: command.hotkey,
    };
  });
}

export function getLegacyCommandCode(commandId: GridCommandId) {
  return GRID_COMMAND_CATALOG[commandId].legacyCode;
}

export function getGridCommand(commandId: GridCommandId, locale?: SupportedLocale) {
  return createDefaultCommandRegistry(locale).find(
    (command) => command.id === commandId,
  );
}
