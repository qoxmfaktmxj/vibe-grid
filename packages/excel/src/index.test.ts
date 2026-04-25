import assert from "node:assert/strict";
import test from "node:test";
import type { VibeGridColumn } from "@vibe-grid/core";
import {
  createGridExcelSchema,
  exportRowsToExcelBuffer,
  importExcelPreview,
  validateExactHeaders,
} from "./index";

type EmployeeRow = {
  employeeId: string;
  employeeName: string;
  salary: number;
  secretNote?: string;
};

const employeeColumns: VibeGridColumn<EmployeeRow>[] = [
  {
    key: "employeeId",
    header: "Employee ID",
    required: true,
  },
  {
    key: "employeeName",
    header: "Employee Name",
    required: true,
  },
  {
    key: "salary",
    header: "Salary",
    parse: (value) => Number(value),
  },
  {
    key: "secretNote",
    header: "Secret Note",
    hidden: true,
  },
];

test("createGridExcelSchema includes only visible columns and required visible fields", () => {
  const schema = createGridExcelSchema(employeeColumns, "test-version");

  assert.equal(schema.version, "test-version");
  assert.deepEqual(schema.visibleHeaders, [
    "Employee ID",
    "Employee Name",
    "Salary",
  ]);
  assert.deepEqual(schema.fields, ["employeeId", "employeeName", "salary"]);
  assert.deepEqual(schema.requiredFields, ["employeeId", "employeeName"]);
});

test("validateExactHeaders reports missing and unknown headers", () => {
  const result = validateExactHeaders(
    ["Employee ID", "Employee Name", "Salary"],
    ["Employee ID", "Full Name", "Salary", "Legacy Code"],
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.missingHeaders, ["Employee Name"]);
  assert.deepEqual(result.unknownHeaders, ["Full Name", "Legacy Code"]);
});

test("exportRowsToExcelBuffer and importExcelPreview roundtrip visible row values", async () => {
  const buffer = await exportRowsToExcelBuffer({
    sheetName: "Employees",
    columns: employeeColumns,
    rows: [
      {
        employeeId: "EMP-001",
        employeeName: "Kim",
        salary: 7200,
        secretNote: "do not export",
      },
      {
        employeeId: "EMP-002",
        employeeName: "Lee",
        salary: 6800,
        secretNote: "hidden",
      },
    ],
    version: "roundtrip-test",
  });

  const preview = await importExcelPreview<EmployeeRow>({
    buffer: buffer as ArrayBuffer,
    columns: employeeColumns,
    version: "roundtrip-test",
  });

  assert.equal(preview.ok, true);
  assert.deepEqual(preview.headers, [
    "Employee ID",
    "Employee Name",
    "Salary",
  ]);
  assert.deepEqual(preview.matrix, [
    ["EMP-001", "Kim", "7200"],
    ["EMP-002", "Lee", "6800"],
  ]);
  assert.deepEqual(preview.rows, [
    { employeeId: "EMP-001", employeeName: "Kim", salary: 7200 },
    { employeeId: "EMP-002", employeeName: "Lee", salary: 6800 },
  ]);
  assert.equal(preview.text, "EMP-001\tKim\t7200\nEMP-002\tLee\t6800");
});

test("importExcelPreview keeps rows available while flagging header mismatch", async () => {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Employees");

  sheet.addRow(["Employee ID", "Full Name", "Salary"]);
  sheet.addRow(["EMP-001", "Kim", 7200]);

  const buffer = await workbook.xlsx.writeBuffer();
  const preview = await importExcelPreview<EmployeeRow>({
    buffer: buffer as ArrayBuffer,
    columns: employeeColumns,
  });

  assert.equal(preview.ok, false);
  assert.deepEqual(preview.missingHeaders, ["Employee Name"]);
  assert.deepEqual(preview.unknownHeaders, ["Full Name"]);
  assert.deepEqual(preview.rows, [
    { employeeId: "EMP-001", employeeName: "Kim", salary: 7200 },
  ]);
});
