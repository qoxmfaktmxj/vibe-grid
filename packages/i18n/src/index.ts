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
  validationRequired: "grid.validation.required",
  clipboardParseFailed: "grid.clipboard.parseFailed",
  statusGridLabReady: "grid.status.gridLabReady",
  statusLoadSuccess: "grid.status.loadSuccess",
  statusLoadError: "grid.status.loadError",
  statusMissingAnchorCell: "grid.status.missingAnchorCell",
  statusMissingAnchorRow: "grid.status.missingAnchorRow",
  statusRowOverflowRejected: "grid.status.rowOverflowRejected",
  statusNoApplicableClipboardData: "grid.status.noApplicableClipboardData",
  statusPasteValidationOnly: "grid.status.pasteValidationOnly",
  statusPasteApplied: "grid.status.pasteApplied",
  statusPasteAppliedWithIssues: "grid.status.pasteAppliedWithIssues",
  statusInsertRowAdded: "grid.status.insertRowAdded",
  statusCopyRowMissingSelection: "grid.status.copyRowMissingSelection",
  statusCopyRowSuccess: "grid.status.copyRowSuccess",
  statusToggleDeleteMissingSelection: "grid.status.toggleDeleteMissingSelection",
  statusToggleDeleteSuccess: "grid.status.toggleDeleteSuccess",
  statusSaveBlockedValidation: "grid.status.saveBlockedValidation",
  statusSaveSummary: "grid.status.saveSummary",
  statusExportExcelSuccess: "grid.status.exportExcelSuccess",
  statusDownloadTemplateSuccess: "grid.status.downloadTemplateSuccess",
  statusClipboardReadSuccess: "grid.status.clipboardReadSuccess",
  statusClipboardReadDenied: "grid.status.clipboardReadDenied",
  statusImportPreviewSuccess: "grid.status.importPreviewSuccess",
  statusImportPreviewHeaderMismatch: "grid.status.importPreviewHeaderMismatch",
  statusImportApplyBlockedHeader: "grid.status.importApplyBlockedHeader",
} as const;

export type GridLocale = "ko-KR" | "en-US";
export type GridMessageKey =
  (typeof gridMessageKeys)[keyof typeof gridMessageKeys];
export type GridMessageValues = Record<string, string | number>;

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
    [gridMessageKeys.validationRequired]: "{columnHeader}은(는) 필수입니다.",
    [gridMessageKeys.clipboardParseFailed]: "클립보드 값을 해석하지 못했습니다.",
    [gridMessageKeys.statusGridLabReady]:
      "Grid Lab에서 조회, 입력, 저장, 엑셀, 붙여넣기, 컬럼 상태를 함께 검증할 수 있습니다.",
    [gridMessageKeys.statusLoadSuccess]:
      "{reason}: 서버에서 {rowCount}건을 불러왔습니다. 전체 {totalCount}건, {pageNumber}/{pageCount} 페이지입니다.",
    [gridMessageKeys.statusLoadError]:
      "서버 조회에 실패했습니다. {error}",
    [gridMessageKeys.statusMissingAnchorCell]:
      "먼저 그리드에서 시작 셀을 선택해 주세요.",
    [gridMessageKeys.statusMissingAnchorRow]:
      "선택된 행이 없어 데이터를 적용할 수 없습니다.",
    [gridMessageKeys.statusRowOverflowRejected]:
      "붙여넣기가 현재 로드된 행 범위에서 중단됐습니다. 행 초과 정책이 reject로 설정되어 있습니다.",
    [gridMessageKeys.statusNoApplicableClipboardData]:
      "적용 가능한 데이터가 없습니다.",
    [gridMessageKeys.statusPasteValidationOnly]:
      "{sourceLabel}: 검증 오류 {validationCount}건, 건너뜀 {skippedCount}건",
    [gridMessageKeys.statusPasteApplied]:
      "{sourceLabel}: {appliedCellCount}개 셀 반영, 신규 {appendedRowCount}행 추가, 건너뜀 {skippedCount}건 (정책: {rowOverflowPolicy})",
    [gridMessageKeys.statusPasteAppliedWithIssues]:
      "{sourceLabel}: {appliedCellCount}개 셀 반영, 신규 {appendedRowCount}행 추가, 건너뜀 {skippedCount}건, 검증 오류 {validationCount}건 (정책: {rowOverflowPolicy})",
    [gridMessageKeys.statusInsertRowAdded]:
      "신규 행을 추가했습니다. 현재 페이지의 로컬 작업 상태입니다.",
    [gridMessageKeys.statusCopyRowMissingSelection]:
      "복사할 행을 먼저 선택해 주세요.",
    [gridMessageKeys.statusCopyRowSuccess]:
      "선택한 행을 복사했습니다.",
    [gridMessageKeys.statusToggleDeleteMissingSelection]:
      "삭제 토글할 행을 먼저 선택해 주세요.",
    [gridMessageKeys.statusToggleDeleteSuccess]:
      "{rowCount}개 행의 삭제 토글 상태를 바꿨습니다.",
    [gridMessageKeys.statusSaveBlockedValidation]:
      "검증 오류가 남아 있어 저장할 수 없습니다.",
    [gridMessageKeys.statusSaveSummary]:
      "저장 번들을 만들었습니다. 입력 {insertedCount}건, 수정 {updatedCount}건, 삭제 {deletedCount}건",
    [gridMessageKeys.statusExportExcelSuccess]:
      "현재 그리드 데이터를 엑셀로 내보냈습니다.",
    [gridMessageKeys.statusDownloadTemplateSuccess]:
      "엑셀 양식을 다운로드했습니다.",
    [gridMessageKeys.statusClipboardReadSuccess]:
      "클립보드 내용을 가져왔습니다. 적용 버튼으로 반영해 주세요.",
    [gridMessageKeys.statusClipboardReadDenied]:
      "클립보드 권한이 없어 자동으로 읽지 못했습니다. 아래 영역에 직접 붙여넣어 주세요.",
    [gridMessageKeys.statusImportPreviewSuccess]:
      "엑셀 미리보기 완료: {rowCount}행을 읽었습니다.",
    [gridMessageKeys.statusImportPreviewHeaderMismatch]:
      "엑셀 헤더 불일치: 누락 {missingHeaders}, 알 수 없는 헤더 {unknownHeaders}",
    [gridMessageKeys.statusImportApplyBlockedHeader]:
      "헤더가 맞지 않아 업로드를 적용할 수 없습니다.",
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
    [gridMessageKeys.validationRequired]: "{columnHeader} is required.",
    [gridMessageKeys.clipboardParseFailed]:
      "Failed to parse the clipboard value.",
    [gridMessageKeys.statusGridLabReady]:
      "Grid Lab can validate search, insert, save, Excel, paste, and column state together.",
    [gridMessageKeys.statusLoadSuccess]:
      "{reason}: loaded {rowCount} rows from the server. Total {totalCount} rows, page {pageNumber}/{pageCount}.",
    [gridMessageKeys.statusLoadError]:
      "Server load failed. {error}",
    [gridMessageKeys.statusMissingAnchorCell]:
      "Select a starting cell before applying pasted data.",
    [gridMessageKeys.statusMissingAnchorRow]:
      "There is no selected row to receive pasted data.",
    [gridMessageKeys.statusRowOverflowRejected]:
      "Paste stopped at the loaded row boundary because the row overflow policy is set to reject.",
    [gridMessageKeys.statusNoApplicableClipboardData]:
      "There was no applicable clipboard data to apply.",
    [gridMessageKeys.statusPasteValidationOnly]:
      "{sourceLabel}: validation {validationCount}, skipped {skippedCount}",
    [gridMessageKeys.statusPasteApplied]:
      "{sourceLabel}: applied {appliedCellCount} cells, appended {appendedRowCount} rows, skipped {skippedCount} cells (policy: {rowOverflowPolicy}).",
    [gridMessageKeys.statusPasteAppliedWithIssues]:
      "{sourceLabel}: applied {appliedCellCount} cells, appended {appendedRowCount} rows, skipped {skippedCount} cells, validation {validationCount} (policy: {rowOverflowPolicy}).",
    [gridMessageKeys.statusInsertRowAdded]:
      "Inserted a new row into the current page-local working set.",
    [gridMessageKeys.statusCopyRowMissingSelection]:
      "Select a row to copy first.",
    [gridMessageKeys.statusCopyRowSuccess]:
      "Copied the selected row.",
    [gridMessageKeys.statusToggleDeleteMissingSelection]:
      "Select rows before toggling delete.",
    [gridMessageKeys.statusToggleDeleteSuccess]:
      "Toggled delete state for {rowCount} rows.",
    [gridMessageKeys.statusSaveBlockedValidation]:
      "Cannot save while validation errors remain.",
    [gridMessageKeys.statusSaveSummary]:
      "Created a save bundle. Inserted {insertedCount}, updated {updatedCount}, deleted {deletedCount}.",
    [gridMessageKeys.statusExportExcelSuccess]:
      "Exported the current grid data to Excel.",
    [gridMessageKeys.statusDownloadTemplateSuccess]:
      "Downloaded the Excel template.",
    [gridMessageKeys.statusClipboardReadSuccess]:
      "Read the clipboard contents. Apply them with the action button.",
    [gridMessageKeys.statusClipboardReadDenied]:
      "Clipboard permission was unavailable. Paste the data directly into the text area.",
    [gridMessageKeys.statusImportPreviewSuccess]:
      "Excel preview loaded: read {rowCount} rows.",
    [gridMessageKeys.statusImportPreviewHeaderMismatch]:
      "Excel header mismatch: missing {missingHeaders}, unknown {unknownHeaders}",
    [gridMessageKeys.statusImportApplyBlockedHeader]:
      "The upload cannot be applied because the header does not match.",
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

export function formatGridMessage(
  key: GridMessageKey,
  values: GridMessageValues = {},
  locale: GridLocale = defaultLocale,
) {
  const template = getGridMessage(key, locale);
  return template.replace(/\{(\w+)\}/g, (_, token: string) =>
    values[token] == null ? `{${token}}` : String(values[token]),
  );
}
