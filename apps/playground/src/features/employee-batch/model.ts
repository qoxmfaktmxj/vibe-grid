import type {
  GridQuery,
  GridSortRule,
  ManagedGridRow,
  VibeGridColumn,
} from "@vibe-grid/core";
import { createLoadedRow } from "@vibe-grid/core";

export type EmployeeBatchRow = {
  rowKey: string;
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  department: string;
  businessUnit: string;
  jobTitle: string;
  employmentType: "정규직" | "계약직";
  insuranceRate: number;
  workStatus: "재직" | "휴직" | "발령예정";
  location: "서울" | "판교" | "대전";
};

const DEPARTMENTS = ["인사운영", "재무전략", "지원본부", "인재개발"] as const;
const BUSINESS_UNITS = ["HQ", "플랫폼", "경영지원"] as const;
const JOB_TITLES = ["Staff", "Lead", "Manager"] as const;
const LOCATIONS = ["서울", "판교", "대전"] as const;

function compareValues(left: unknown, right: unknown) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left ?? "").localeCompare(String(right ?? ""), "ko-KR", {
    numeric: true,
    sensitivity: "base",
  });
}

export function createEmployeeBatchRows(totalRows: number) {
  return Array.from({ length: totalRows }, (_, index) => {
    const nextIndex = index + 1;
    const department = DEPARTMENTS[index % DEPARTMENTS.length];
    const businessUnit = BUSINESS_UNITS[index % BUSINESS_UNITS.length];
    const jobTitle = JOB_TITLES[index % JOB_TITLES.length];
    const location = LOCATIONS[index % LOCATIONS.length];

    return {
      rowKey: `employee-row-${nextIndex}`,
      employeeId: `EMPID-${String(nextIndex).padStart(6, "0")}`,
      employeeNo: `EMPNO-${String(nextIndex).padStart(6, "0")}`,
      employeeName: `직원 ${nextIndex}`,
      department,
      businessUnit,
      jobTitle,
      employmentType: nextIndex % 5 === 0 ? "계약직" : "정규직",
      insuranceRate: Number((3.1 + (nextIndex % 7) * 0.05).toFixed(2)),
      workStatus:
        nextIndex % 11 === 0
          ? "휴직"
          : nextIndex % 13 === 0
            ? "발령예정"
            : "재직",
      location,
    } satisfies EmployeeBatchRow;
  });
}

export function createLoadedEmployeeBatchRows(totalRows: number) {
  return createEmployeeBatchRows(totalRows).map((row) =>
    createLoadedRow(row.rowKey, row),
  );
}

export function applyEmployeeBatchSorting(
  rows: ManagedGridRow<EmployeeBatchRow>[],
  sorting: GridSortRule[],
) {
  const primarySort = sorting[0];

  if (!primarySort) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    const direction = primarySort.desc ? -1 : 1;
    return (
      compareValues(
        left.row[primarySort.id as keyof EmployeeBatchRow],
        right.row[primarySort.id as keyof EmployeeBatchRow],
      ) * direction
    );
  });
}

export function paginateEmployeeBatchRows(
  rows: ManagedGridRow<EmployeeBatchRow>[],
  pageIndex: number,
  pageSize: number,
) {
  const startIndex = pageIndex * pageSize;
  return rows.slice(startIndex, startIndex + pageSize);
}

export function createEmployeeBatchQuery(
  pageIndex: number,
  pageSize: number,
  sorting: GridSortRule[],
): GridQuery {
  return {
    pageIndex,
    pageSize,
    sorting,
    filters: [],
  };
}

export const employeeBatchColumns: VibeGridColumn<EmployeeBatchRow>[] = [
  {
    key: "employeeNo",
    header: "사번",
    width: 150,
    minWidth: 130,
    sortable: true,
    pin: "left",
  },
  {
    key: "employeeName",
    header: "이름",
    width: 180,
    minWidth: 150,
    sortable: true,
  },
  {
    key: "department",
    header: "부서",
    width: 170,
    minWidth: 140,
    sortable: true,
  },
  {
    key: "businessUnit",
    header: "사업장",
    width: 130,
    minWidth: 120,
    sortable: true,
  },
  {
    key: "jobTitle",
    header: "직급",
    width: 130,
    minWidth: 110,
    sortable: true,
  },
  {
    key: "employmentType",
    header: "고용형태",
    width: 130,
    minWidth: 120,
    sortable: true,
  },
  {
    key: "insuranceRate",
    header: "보험요율",
    width: 130,
    minWidth: 110,
    sortable: true,
    accessor: (row) => `${row.insuranceRate.toFixed(2)}%`,
  },
  {
    key: "workStatus",
    header: "상태",
    width: 130,
    minWidth: 120,
    sortable: true,
  },
  {
    key: "location",
    header: "근무지",
    width: 120,
    minWidth: 110,
    sortable: true,
  },
];

export function createEmployeeBatchPreview(input: {
  request: {
    gridId: string;
    action?: {
      kind: "selectionAction";
      actionId: string;
      mode: "sync" | "async";
    };
    save?: {
      kind: "mutationSave";
      mode: "sync" | "async";
      ordering: string[];
      counts: Record<string, number>;
    };
  };
  selectedCount: number;
  selectionSample: string[];
  selectionFingerprint: string;
}) {
  return {
    gridId: input.request.gridId,
    action: input.request.action
      ? {
          ...input.request.action,
          selectionSummary: {
            selectedCount: input.selectedCount,
            targetIdsSample: input.selectionSample,
            fingerprint: input.selectionFingerprint,
          },
        }
      : undefined,
    save: input.request.save
      ? {
          ...input.request.save,
        }
      : undefined,
    previewMeta: {
      targetIdsRenderedInDom: false,
    },
  };
}
