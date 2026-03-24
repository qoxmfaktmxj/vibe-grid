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
    employeeName: `직원 ${index}`,
    department: index % 2 === 0 ? "인사운영" : "피플플랫폼",
    jobTitle: index % 3 === 0 ? "매니저" : index % 3 === 1 ? "리드" : "스태프",
    useYn: index % 5 === 0 ? "N" : "Y",
    sortOrder: index,
  };
}

export type GridBenchmarkTreeRow = {
  rowKey: string;
  parentRowKey: string | null;
  employeeNo: string;
  employeeName: string;
  department: string;
  jobTitle: string;
  useYn: "Y" | "N";
  sortOrder: number;
};

const treeDepartments = [
  "경영지원", "인사운영", "피플플랫폼", "개발본부", "제품기획",
  "영업전략", "마케팅", "재무회계", "법무", "글로벌사업",
];

const treeJobTitles = ["본부장", "부장", "팀장", "파트장", "매니저"];

export function createBenchmarkTreeRows(
  totalNodes: number,
  branchingFactor = 5,
  maxDepth = 4,
): GridBenchmarkTreeRow[] {
  const rows: GridBenchmarkTreeRow[] = [];
  let counter = 0;

  const addNode = (parentKey: string | null, depth: number) => {
    if (counter >= totalNodes) return;

    counter++;
    const key = `tree-${counter}`;
    const depthLabel = treeJobTitles[Math.min(depth, treeJobTitles.length - 1)];
    rows.push({
      rowKey: key,
      parentRowKey: parentKey,
      employeeNo: `EMP${String(counter).padStart(6, "0")}`,
      employeeName: `${depthLabel} ${counter}`,
      department: treeDepartments[counter % treeDepartments.length],
      jobTitle: depthLabel,
      useYn: counter % 5 === 0 ? "N" : "Y",
      sortOrder: counter,
    });

    if (depth < maxDepth) {
      const children = Math.min(branchingFactor, totalNodes - counter);
      for (let i = 0; i < children; i++) {
        if (counter >= totalNodes) break;
        addNode(key, depth + 1);
      }
    }
  };

  const rootCount = Math.ceil(
    totalNodes / Math.max(1, (Math.pow(branchingFactor, maxDepth) - 1) / (branchingFactor - 1)),
  );
  for (let i = 0; i < Math.max(rootCount, 1); i++) {
    if (counter >= totalNodes) break;
    addNode(null, 0);
  }

  return rows;
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
