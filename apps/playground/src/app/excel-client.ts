import type {
  GridExcelImportPreview,
} from "@vibe-grid/excel";
import type { VibeGridColumn } from "@vibe-grid/core";

type RowRecord = Record<string, unknown>;

async function loadExcelModule() {
  return import("@vibe-grid/excel");
}

export type { GridExcelImportPreview };

export async function exportRowsToExcelBufferLazy<Row extends RowRecord>(input: {
  sheetName: string;
  columns: ReadonlyArray<VibeGridColumn<Row>>;
  rows: readonly Row[];
  version?: string;
}) {
  const { exportRowsToExcelBuffer } = await loadExcelModule();
  return exportRowsToExcelBuffer(input);
}

export async function createExcelTemplateBufferLazy<Row extends RowRecord>(input: {
  sheetName: string;
  columns: ReadonlyArray<VibeGridColumn<Row>>;
  sampleRows?: readonly Partial<Row>[];
  version?: string;
}) {
  const { createExcelTemplateBuffer } = await loadExcelModule();
  return createExcelTemplateBuffer(input);
}

export async function importExcelPreviewLazy<Row extends RowRecord>(input: {
  buffer: ArrayBuffer;
  columns: ReadonlyArray<VibeGridColumn<Row>>;
  version?: string;
}): Promise<GridExcelImportPreview<Row>> {
  const { importExcelPreview } = await loadExcelModule();
  return importExcelPreview<Row>(input);
}
