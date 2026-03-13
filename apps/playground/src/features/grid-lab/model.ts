import type {
  GridEditorOption,
  GridFilter,
  GridQuery,
  GridServerResult,
  GridSortRule,
  VibeGridColumn,
} from "@vibe-grid/core";

export type PlaygroundRow = {
  sampleCode: string;
  sampleName: string;
  department: string;
  jobTitle: string;
  useYn: "Y" | "N";
  sortOrder: number;
  note: string;
};

export const departmentOptions: GridEditorOption[] = [
  { label: "인사운영팀", value: "인사운영팀" },
  { label: "평가보상팀", value: "평가보상팀" },
  { label: "급여팀", value: "급여팀" },
  { label: "HRBP", value: "HRBP" },
  { label: "채용팀", value: "채용팀" },
  { label: "교육팀", value: "교육팀" },
];

export const jobTitleOptions: GridEditorOption[] = [
  { label: "사원", value: "사원" },
  { label: "주임", value: "주임" },
  { label: "책임", value: "책임" },
  { label: "매니저", value: "매니저" },
  { label: "파트장", value: "파트장" },
];

export const useYnOptions: GridEditorOption[] = [
  { label: "사용", value: "Y" },
  { label: "미사용", value: "N" },
];

const sampleNameCatalog = [
  "인사기본",
  "평가운영",
  "급여정산",
  "조직개편",
  "채용전환",
  "복리후생",
  "교육이력",
  "승진심사",
  "근태집계",
  "성과관리",
];

const noteCatalog = [
  "기본 마스터 검증 시나리오",
  "저장 payload 분리 체크",
  "엑셀 업로드 헤더 검증용",
  "삭제 체크 후 저장 흐름 확인",
  "클립보드 붙여넣기 테스트",
  "서버 정렬 및 필터 테스트 데이터",
];

export const firstEditableColumnKey: keyof PlaygroundRow = "sampleCode";

export const playgroundColumns: VibeGridColumn<PlaygroundRow>[] = [
  {
    key: "sampleCode",
    header: "샘플코드",
    width: 150,
    minWidth: 120,
    editable: true,
    required: true,
    sortable: true,
    filterable: true,
    editor: {
      type: "text",
      placeholder: "예: HR-001",
    },
    filterEditor: {
      type: "text",
      placeholder: "코드 검색",
    },
    validate: [
      (value) =>
        String(value ?? "").trim().length >= 3
          ? null
          : "샘플코드는 3자 이상이어야 합니다.",
    ],
  },
  {
    key: "sampleName",
    header: "샘플명",
    width: 180,
    minWidth: 140,
    editable: true,
    required: true,
    sortable: true,
    filterable: true,
    editor: {
      type: "text",
      placeholder: "예: 인사기본",
    },
    filterEditor: {
      type: "text",
      placeholder: "샘플명 검색",
    },
  },
  {
    key: "department",
    header: "부서",
    width: 170,
    minWidth: 140,
    editable: true,
    required: true,
    sortable: true,
    filterable: true,
    editor: {
      type: "select",
      options: departmentOptions,
    },
    filterEditor: {
      type: "select",
      options: departmentOptions,
      emptyLabel: "전체",
    },
  },
  {
    key: "jobTitle",
    header: "직급",
    width: 130,
    minWidth: 110,
    editable: true,
    required: true,
    sortable: true,
    filterable: true,
    editor: {
      type: "select",
      options: jobTitleOptions,
    },
    filterEditor: {
      type: "select",
      options: jobTitleOptions,
      emptyLabel: "전체",
    },
  },
  {
    key: "useYn",
    header: "사용여부",
    width: 130,
    minWidth: 120,
    editable: true,
    required: true,
    sortable: true,
    filterable: true,
    parse: (value) => (value.trim().toUpperCase() === "N" ? "N" : "Y"),
    editor: {
      type: "select",
      options: useYnOptions,
    },
    filterEditor: {
      type: "select",
      options: useYnOptions,
      emptyLabel: "전체",
    },
    validate: [
      (value) =>
        value === "Y" || value === "N"
          ? null
          : "사용여부는 Y 또는 N이어야 합니다.",
    ],
  },
  {
    key: "sortOrder",
    header: "정렬순서",
    width: 120,
    minWidth: 100,
    editable: true,
    required: true,
    sortable: true,
    filterable: true,
    parse: (value) => Number(value.trim() || "0"),
    editor: {
      type: "number",
      min: 0,
      step: 1,
      placeholder: "0",
    },
    filterEditor: {
      type: "number",
      placeholder: "번호",
      op: "eq",
    },
    validate: [
      (value) =>
        Number.isFinite(Number(value)) && Number(value) >= 0
          ? null
          : "정렬순서는 0 이상의 숫자여야 합니다.",
    ],
  },
  {
    key: "note",
    header: "비고",
    width: 260,
    minWidth: 180,
    editable: (row) => row.useYn === "Y",
    filterable: true,
    editor: {
      type: "textarea",
      rows: 4,
      placeholder: "비고를 입력하세요.",
    },
    filterEditor: {
      type: "text",
      placeholder: "비고 검색",
    },
  },
];

export const defaultGridQuery: GridQuery = {
  pageIndex: 0,
  pageSize: 12,
  sorting: [{ id: "sampleCode", desc: false }],
  filters: [],
};

export function createBlankRow(sequence: number): PlaygroundRow {
  return {
    sampleCode: `NEW-${String(sequence).padStart(3, "0")}`,
    sampleName: "신규 항목",
    department: "인사운영팀",
    jobTitle: "사원",
    useYn: "Y",
    sortOrder: sequence,
    note: "입력 전 기본 데이터입니다.",
  };
}

export function buildGridQuerySearchParams(query: GridQuery) {
  const searchParams = new URLSearchParams();
  searchParams.set("pageIndex", String(query.pageIndex));
  searchParams.set("pageSize", String(query.pageSize));
  searchParams.set("sorting", JSON.stringify(query.sorting));
  searchParams.set("filters", JSON.stringify(query.filters));
  return searchParams;
}

export function parseGridQuerySearchParams(
  searchParams: URLSearchParams,
): GridQuery {
  const pageIndex = Number(searchParams.get("pageIndex") ?? defaultGridQuery.pageIndex);
  const pageSize = Number(searchParams.get("pageSize") ?? defaultGridQuery.pageSize);

  return {
    pageIndex: Number.isFinite(pageIndex) && pageIndex >= 0 ? pageIndex : 0,
    pageSize:
      Number.isFinite(pageSize) && pageSize > 0
        ? pageSize
        : defaultGridQuery.pageSize,
    sorting: parseJsonValue<GridSortRule[]>(
      searchParams.get("sorting"),
      defaultGridQuery.sorting,
    ),
    filters: parseJsonValue<GridFilter[]>(
      searchParams.get("filters"),
      defaultGridQuery.filters,
    ),
  };
}

export function buildGridLabServerResult(
  query: GridQuery,
): GridServerResult<PlaygroundRow> {
  const allRows = createPlaygroundDataset(120);
  const filteredRows = applyFilters(allRows, query.filters);
  const sortedRows = applySorting(filteredRows, query.sorting);
  const totalCount = sortedRows.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / query.pageSize));
  const safePageIndex = Math.min(query.pageIndex, pageCount - 1);
  const startIndex = safePageIndex * query.pageSize;
  const rows = sortedRows.slice(startIndex, startIndex + query.pageSize);

  return {
    rows,
    totalCount,
    pageCount,
    pageIndex: safePageIndex,
    pageSize: query.pageSize,
    query: {
      ...query,
      pageIndex: safePageIndex,
    },
  };
}

function createPlaygroundDataset(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const sequence = index + 1;
    const sampleName = sampleNameCatalog[index % sampleNameCatalog.length];
    const department = departmentOptions[index % departmentOptions.length].value;
    const jobTitle = jobTitleOptions[index % jobTitleOptions.length].value;
    const useYn = useYnOptions[index % useYnOptions.length].value as "Y" | "N";
    const note = noteCatalog[index % noteCatalog.length];

    return {
      sampleCode: `HR-${String(sequence).padStart(3, "0")}`,
      sampleName,
      department,
      jobTitle,
      useYn,
      sortOrder: sequence,
      note: `${note} #${sequence}`,
    } satisfies PlaygroundRow;
  });
}

function applyFilters(rows: PlaygroundRow[], filters: GridFilter[]) {
  return filters.reduce((currentRows, filter) => {
    const rawValue =
      typeof filter.value === "string" ? filter.value.trim() : filter.value;

    if (filter.field === "keyword" && typeof rawValue === "string") {
      if (!rawValue) {
        return currentRows;
      }

      const keyword = rawValue.toLowerCase();
      return currentRows.filter((row) =>
        [
          row.sampleCode,
          row.sampleName,
          row.department,
          row.jobTitle,
          row.note,
        ].some((value) => value.toLowerCase().includes(keyword)),
      );
    }

    if (!isPlaygroundField(filter.field)) {
      return currentRows;
    }

    const field = filter.field;

    if (rawValue == null || rawValue === "") {
      return currentRows;
    }

    return currentRows.filter((row) => matchesFilter(row[field], rawValue, filter.op));
  }, rows);
}

function isPlaygroundField(field: string): field is keyof PlaygroundRow {
  return [
    "sampleCode",
    "sampleName",
    "department",
    "jobTitle",
    "useYn",
    "sortOrder",
    "note",
  ].includes(field);
}

function matchesFilter(
  rowValue: PlaygroundRow[keyof PlaygroundRow],
  filterValue: string | number | unknown,
  operator: string,
) {
  if (typeof rowValue === "number") {
    const numericValue = Number(filterValue);

    if (!Number.isFinite(numericValue)) {
      return false;
    }

    if (operator === "gte") {
      return rowValue >= numericValue;
    }

    if (operator === "lte") {
      return rowValue <= numericValue;
    }

    return rowValue === numericValue;
  }

  const left = String(rowValue).toLowerCase();
  const right = String(filterValue).toLowerCase();

  if (operator === "eq") {
    return left === right;
  }

  return left.includes(right);
}

function applySorting(rows: PlaygroundRow[], sorting: GridSortRule[]) {
  if (sorting.length === 0) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    for (const sort of sorting) {
      const compareValue = compareField(left, right, sort.id as keyof PlaygroundRow);
      if (compareValue !== 0) {
        return sort.desc ? compareValue * -1 : compareValue;
      }
    }

    return 0;
  });
}

function compareField(
  left: PlaygroundRow,
  right: PlaygroundRow,
  key: keyof PlaygroundRow,
) {
  const leftValue = left[key];
  const rightValue = right[key];

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return leftValue - rightValue;
  }

  return String(leftValue).localeCompare(String(rightValue), "ko-KR", {
    numeric: true,
  });
}

function parseJsonValue<Value>(raw: string | null, fallback: Value): Value {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as Value;
  } catch {
    return fallback;
  }
}
