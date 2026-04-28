# @vibe-grid/excel

VibeGrid의 Excel 입출력 유틸리티. ExcelJS 기반으로 그리드 데이터 내보내기, 양식 다운로드, 업로드 미리보기를 지원합니다.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/excel exceljs
```

## 빠른 예시

```ts
import {
  createGridExcelSchema,
  exportRowsToExcelBuffer,
  createExcelTemplateBuffer,
  importExcelPreview,
  validateExactHeaders,
} from "@vibe-grid/excel";

// 현재 그리드 데이터를 Excel로 내보내기
const buffer = await exportRowsToExcelBuffer({
  sheetName: "직원 목록",
  columns,
  rows,
});
const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

// 입력 양식(빈 템플릿) 다운로드
const templateBuffer = await createExcelTemplateBuffer({
  sheetName: "입력 양식",
  columns,
  sampleRows: [{ name: "예시 이름", age: 30 }],
});

// 업로드 파일 미리보기 및 헤더 검증
const preview = await importExcelPreview({ buffer: fileArrayBuffer, columns });
if (preview.ok) {
  // preview.rows 사용
}
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)
- [공개 API 안정성 경계](https://github.com/qoxmfaktmxj/vibe-grid/blob/master/docs/release/public-api-stability.md)
- [Lab 데모](https://grid.minseok91.cloud)

## 라이선스

MIT
