export type GridBenchmarkRow = {
  rowKey: string;
  employeeNo: string;
  employeeName: string;
  department: string;
  jobTitle: string;
  useYn: "Y" | "N";
  sortOrder: number;
};

export type GridBenchmarkSnapshot = {
  totalRows: number;
  firstRows: GridBenchmarkRow[];
  lastRow: GridBenchmarkRow;
};

export function createBenchmarkRows(
  totalRows: number,
  startIndex = 1,
): GridBenchmarkRow[] {
  return Array.from({ length: totalRows }, (_, index) =>
    createBenchmarkRow(startIndex + index),
  );
}

export function createBenchmarkRow(index: number): GridBenchmarkRow {
  return {
    rowKey: `row-${index}`,
    employeeNo: `EMP${String(index).padStart(6, "0")}`,
    employeeName: `Employee ${index}`,
    department: index % 2 === 0 ? "HR Operations" : "People Platform",
    jobTitle: index % 3 === 0 ? "Manager" : index % 3 === 1 ? "Lead" : "Staff",
    useYn: index % 5 === 0 ? "N" : "Y",
    sortOrder: index,
  };
}

export function createBenchmarkSnapshot(
  totalRows: number,
  sampleSize = 5,
): GridBenchmarkSnapshot {
  const firstRows = createBenchmarkRows(sampleSize);

  return {
    totalRows,
    firstRows,
    lastRow: createBenchmarkRow(totalRows),
  };
}
