# @vibe-grid/clipboard

VibeGrid의 직사각형 붙여넣기 엔진. TSV 파싱, 열/행 오버플로우 정책, 유효성 검증을 포함한 순수 함수 라이브러리.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/clipboard
```

## 빠른 예시

```ts
import {
  parseTsv,
  createClipboardSchema,
  buildRectangularPastePlan,
  summarizeRectangularPastePlan,
} from "@vibe-grid/clipboard";

// TSV 텍스트 파싱
const matrix = parseTsv("Alice\t30\nBob\t25");

// 컬럼 정의에서 붙여넣기 스키마 생성
const schema = createClipboardSchema(columns);

// 붙여넣기 계획 수립 (실제 데이터 변경 없음)
const plan = buildRectangularPastePlan({
  text: clipboardText,
  columns: schema,
  rowOrder: rowKeys,
  anchor: { rowKey: "row-1", columnKey: "name" },
  rowOverflowPolicy: "append",
});

// 요약 통계 확인
const summary = summarizeRectangularPastePlan(plan);
// summary.appliedCellCount, summary.validationErrorCount, ...
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)
- [공개 API 안정성 경계](https://github.com/qoxmfaktmxj/vibe-grid/blob/master/docs/release/public-api-stability.md)
- [Lab 데모](https://grid.minseok91.cloud)

## 라이선스

MIT
