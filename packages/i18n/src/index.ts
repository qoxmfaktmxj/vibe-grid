export const defaultLocale = "ko-KR";

export const gridMessageKeys = {
  search: "grid.command.search",
  insert: "grid.command.insert",
  copyRow: "grid.command.copyRow",
  toggleDelete: "grid.command.toggleDelete",
  save: "grid.command.save",
  exportExcel: "grid.command.exportExcel",
  downloadTemplate: "grid.command.downloadTemplate",
  importExcel: "grid.command.importExcel",
  headerMenuSortAsc: "grid.headerMenu.sortAsc",
  headerMenuSortDesc: "grid.headerMenu.sortDesc",
  headerMenuClearSort: "grid.headerMenu.clearSort",
  headerMenuPinLeft: "grid.headerMenu.pinLeft",
  headerMenuPinRight: "grid.headerMenu.pinRight",
  headerMenuUnpin: "grid.headerMenu.unpin",
  headerMenuHide: "grid.headerMenu.hide",
  headerMenuResetWidth: "grid.headerMenu.resetWidth",
  headerMenuAriaLabel: "grid.headerMenu.ariaLabel",
} as const;

export type GridLocale = "ko-KR" | "en-US";
export type GridMessageKey =
  (typeof gridMessageKeys)[keyof typeof gridMessageKeys];

const gridMessages: Record<GridLocale, Record<GridMessageKey, string>> = {
  "ko-KR": {
    [gridMessageKeys.search]: "조회",
    [gridMessageKeys.insert]: "입력",
    [gridMessageKeys.copyRow]: "복사",
    [gridMessageKeys.toggleDelete]: "삭제",
    [gridMessageKeys.save]: "저장",
    [gridMessageKeys.exportExcel]: "엑셀 다운로드",
    [gridMessageKeys.downloadTemplate]: "양식 다운로드",
    [gridMessageKeys.importExcel]: "엑셀 업로드",
    [gridMessageKeys.headerMenuSortAsc]: "오름차순 정렬",
    [gridMessageKeys.headerMenuSortDesc]: "내림차순 정렬",
    [gridMessageKeys.headerMenuClearSort]: "정렬 해제",
    [gridMessageKeys.headerMenuPinLeft]: "왼쪽 고정",
    [gridMessageKeys.headerMenuPinRight]: "오른쪽 고정",
    [gridMessageKeys.headerMenuUnpin]: "고정 해제",
    [gridMessageKeys.headerMenuHide]: "컬럼 숨김",
    [gridMessageKeys.headerMenuResetWidth]: "폭 초기화",
    [gridMessageKeys.headerMenuAriaLabel]: "헤더 메뉴",
  },
  "en-US": {
    [gridMessageKeys.search]: "Search",
    [gridMessageKeys.insert]: "Insert",
    [gridMessageKeys.copyRow]: "Copy Row",
    [gridMessageKeys.toggleDelete]: "Toggle Delete",
    [gridMessageKeys.save]: "Save",
    [gridMessageKeys.exportExcel]: "Export Excel",
    [gridMessageKeys.downloadTemplate]: "Download Template",
    [gridMessageKeys.importExcel]: "Import Excel",
    [gridMessageKeys.headerMenuSortAsc]: "Sort ascending",
    [gridMessageKeys.headerMenuSortDesc]: "Sort descending",
    [gridMessageKeys.headerMenuClearSort]: "Clear sort",
    [gridMessageKeys.headerMenuPinLeft]: "Pin left",
    [gridMessageKeys.headerMenuPinRight]: "Pin right",
    [gridMessageKeys.headerMenuUnpin]: "Unpin",
    [gridMessageKeys.headerMenuHide]: "Hide column",
    [gridMessageKeys.headerMenuResetWidth]: "Reset width",
    [gridMessageKeys.headerMenuAriaLabel]: "Header menu",
  },
};

export function getGridMessage(
  key: GridMessageKey,
  locale: GridLocale = defaultLocale,
) {
  return gridMessages[locale][key];
}

export function getGridMessages(locale: GridLocale = defaultLocale) {
  return gridMessages[locale];
}
