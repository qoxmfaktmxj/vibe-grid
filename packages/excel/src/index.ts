import type { VibeGridColumn } from "@vibe-grid/core";

type RowRecord = Record<string, unknown>;

export type GridExcelSchema = {
  version: string;
  visibleHeaders: string[];
  fields: string[];
  requiredFields: string[];
};

export type GridExcelImportPreview<Row extends RowRecord> = {
  ok: boolean;
  schema: GridExcelSchema;
  headers: string[];
  matrix: string[][];
  missingHeaders: string[];
  unknownHeaders: string[];
  rows: Partial<Row>[];
  text: string;
};

function getVisibleColumns<Row extends RowRecord>(
  columns: ReadonlyArray<VibeGridColumn<Row>>,
) {
  return columns.filter((column) => !column.hidden);
}

function createTsv(matrix: readonly string[][]) {
  return matrix.map((row) => row.join("\t")).join("\n");
}

export function createGridExcelSchema<Row extends RowRecord>(
  columns: ReadonlyArray<VibeGridColumn<Row>>,
  version = "2026.03",
): GridExcelSchema {
  const visibleColumns = getVisibleColumns(columns);

  return {
    version,
    visibleHeaders: visibleColumns.map((column) => column.header),
    fields: visibleColumns.map((column) => column.key),
    requiredFields: visibleColumns
      .filter((column) => column.required)
      .map((column) => column.key),
  };
}

export function validateExactHeaders(
  expectedHeaders: readonly string[],
  receivedHeaders: readonly string[],
) {
  const missingHeaders = expectedHeaders.filter(
    (header) => !receivedHeaders.includes(header),
  );
  const unknownHeaders = receivedHeaders.filter(
    (header) => !expectedHeaders.includes(header),
  );

  return {
    ok: missingHeaders.length === 0 && unknownHeaders.length === 0,
    missingHeaders,
    unknownHeaders,
  };
}

export async function exportRowsToExcelBuffer<Row extends RowRecord>(input: {
  sheetName: string;
  columns: ReadonlyArray<VibeGridColumn<Row>>;
  rows: readonly Row[];
  version?: string;
}) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const schema = createGridExcelSchema(input.columns, input.version);
  const sheet = workbook.addWorksheet(input.sheetName);
  const schemaSheet = workbook.addWorksheet("__schema");
  const visibleColumns = getVisibleColumns(input.columns);

  sheet.addRow(schema.visibleHeaders);
  for (const row of input.rows) {
    sheet.addRow(
      visibleColumns.map((column) => {
        const value = column.accessor ? column.accessor(row) : row[column.key];
        return value == null ? "" : value;
      }),
    );
  }

  schemaSheet.addRow(["field", "header", "required"]);
  visibleColumns.forEach((column) => {
    schemaSheet.addRow([
      column.key,
      column.header,
      column.required ? "Y" : "N",
    ]);
  });
  schemaSheet.state = "hidden";

  return workbook.xlsx.writeBuffer();
}

export async function createExcelTemplateBuffer<Row extends RowRecord>(input: {
  sheetName: string;
  columns: ReadonlyArray<VibeGridColumn<Row>>;
  sampleRows?: readonly Partial<Row>[];
  version?: string;
}) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const schema = createGridExcelSchema(input.columns, input.version);
  const sheet = workbook.addWorksheet(input.sheetName);
  const schemaSheet = workbook.addWorksheet("__schema");
  const visibleColumns = getVisibleColumns(input.columns);

  sheet.addRow(schema.visibleHeaders);
  for (const sampleRow of input.sampleRows ?? []) {
    sheet.addRow(
      visibleColumns.map((column) => {
        const value = sampleRow[column.key as keyof Row];
        return value == null ? "" : value;
      }),
    );
  }

  schemaSheet.addRow(["field", "header", "required", "version"]);
  visibleColumns.forEach((column, index) => {
    schemaSheet.addRow([
      column.key,
      column.header,
      column.required ? "Y" : "N",
      index === 0 ? schema.version : "",
    ]);
  });
  schemaSheet.state = "hidden";

  return workbook.xlsx.writeBuffer();
}

export async function importExcelPreview<Row extends RowRecord>(input: {
  buffer: ArrayBuffer;
  columns: ReadonlyArray<VibeGridColumn<Row>>;
  version?: string;
}): Promise<GridExcelImportPreview<Row>> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(input.buffer);

  const visibleColumns = getVisibleColumns(input.columns);
  const schema = createGridExcelSchema(input.columns, input.version);
  const sheet = workbook.worksheets.find((worksheet) => worksheet.name !== "__schema");

  if (!sheet) {
    return {
      ok: false,
      schema,
      headers: [],
      matrix: [],
      missingHeaders: schema.visibleHeaders,
      unknownHeaders: [],
      rows: [],
      text: "",
    };
  }

  const headerRow = sheet.getRow(1);
  const headerValues = Array.isArray(headerRow.values) ? headerRow.values : [];
  const headers = headerValues
    .slice(1)
    .map((value) => String(value ?? "").trim());
  const headerValidation = validateExactHeaders(schema.visibleHeaders, headers);

  const matrix: string[][] = [];
  const rows: Partial<Row>[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const rowValues = Array.isArray(row.values) ? row.values : [];
    const values = rowValues
      .slice(1, headers.length + 1)
      .map((value) => String(value ?? ""));
    if (values.every((value) => value.trim() === "")) {
      return;
    }

    matrix.push(values);
    const parsedRow: Partial<Row> = {};
    visibleColumns.forEach((column, index) => {
      const rawValue = values[index] ?? "";
      parsedRow[column.key as keyof Row] = column.parse
        ? (column.parse(rawValue, {} as Row) as Row[keyof Row])
        : (rawValue as Row[keyof Row]);
    });
    rows.push(parsedRow);
  });

  return {
    ok: headerValidation.ok,
    schema,
    headers,
    matrix,
    missingHeaders: headerValidation.missingHeaders,
    unknownHeaders: headerValidation.unknownHeaders,
    rows,
    text: createTsv(matrix),
  };
}
