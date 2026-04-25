import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRectangularPastePlan,
  parseTsv,
  summarizeRectangularPastePlan,
  type ClipboardColumn,
} from "./index";

type EmployeeRow = {
  employeeId: string;
  name: string;
  salary: number;
};

const editableColumns: ClipboardColumn<EmployeeRow>[] = [
  {
    key: "name",
    editable: true,
  },
  {
    key: "salary",
    editable: true,
    parse: (value) => Number(value),
  },
];

test("parseTsv normalizes CRLF input and ignores a final trailing newline", () => {
  assert.deepEqual(parseTsv("A\tB\r\nC\tD\r\n"), [
    ["A", "B"],
    ["C", "D"],
  ]);
});

test("buildRectangularPastePlan rejects row overflow by default", () => {
  const plan = buildRectangularPastePlan<EmployeeRow>({
    text: "Kim\nLee",
    columns: editableColumns,
    rowOrder: ["row-1"],
    anchor: {
      rowKey: "row-1",
      columnKey: "name",
    },
  });
  const summary = summarizeRectangularPastePlan(plan);

  assert.equal(plan.rowOverflowPolicy, "reject");
  assert.deepEqual(plan.patches, [
    {
      rowKey: "row-1",
      patch: {
        name: "Kim",
      },
    },
  ]);
  assert.deepEqual(plan.appendedRows, []);
  assert.equal(summary.appliedCellCount, 1);
  assert.equal(summary.skippedCounts.rowOverflow, 1);
});

test("buildRectangularPastePlan appends overflow rows when append policy is enabled", () => {
  const plan = buildRectangularPastePlan<EmployeeRow>({
    text: "Kim\t7200\nLee\t6800",
    columns: editableColumns,
    rowOrder: ["row-1"],
    anchor: {
      rowKey: "row-1",
      columnKey: "name",
    },
    rowOverflowPolicy: "append",
    createAppendedRow: (absoluteRowIndex) => ({
      employeeId: `NEW-${absoluteRowIndex}`,
      name: "",
      salary: 0,
    }),
  });

  assert.equal(plan.rowOverflowPolicy, "append");
  assert.deepEqual(plan.patches, [
    {
      rowKey: "row-1",
      patch: {
        name: "Kim",
        salary: 7200,
      },
    },
  ]);
  assert.deepEqual(plan.appendedRows, [
    {
      name: "Lee",
      salary: 6800,
    },
  ]);
  assert.equal(plan.appliedCellCount, 4);
  assert.equal(plan.rowOverflowCellCount, 0);
});

test("readonly cells are skipped before validation runs", () => {
  let validateCallCount = 0;
  const plan = buildRectangularPastePlan<EmployeeRow>({
    text: "9000",
    columns: [
      {
        key: "salary",
        editable: false,
        parse: (value) => Number(value),
        validate: () => {
          validateCallCount += 1;
          return ["should not run for readonly cells"];
        },
      },
    ],
    rowOrder: ["row-1"],
    anchor: {
      rowKey: "row-1",
      columnKey: "salary",
    },
    rowsByKey: new Map([
      [
        "row-1",
        {
          employeeId: "EMP-001",
          name: "Kim",
          salary: 7200,
        },
      ],
    ]),
  });

  assert.equal(validateCallCount, 0);
  assert.equal(plan.appliedCellCount, 0);
  assert.deepEqual(plan.skippedCells, [
    {
      rowOffset: 0,
      columnOffset: 0,
      reason: "readonly",
      rowKey: "row-1",
      columnKey: "salary",
    },
  ]);
  assert.deepEqual(plan.validationErrors, []);
});
