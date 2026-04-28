# @vibe-grid/core

VibeGrid의 순수 함수 코어 — 행 상태 모델, 유효성 검증, 선택 모델, 컬럼 상태 등 모든 contracts의 진원지.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/core
```

## 빠른 예시

```ts
import {
  createLoadedRow,
  createInsertedRow,
  buildSaveBundle,
  validateManagedRows,
  createSelectionState,
  setActiveCell,
  createGridColumnState,
} from "@vibe-grid/core";

// 행 상태 생성
const row = createLoadedRow({ id: 1, name: "Alice" });
const newRow = createInsertedRow({ id: 2, name: "Bob" });

// 저장 번들 구성
const bundle = buildSaveBundle([row, newRow]);
// bundle.inserted, bundle.updated, bundle.deleted

// 유효성 검증
const errors = validateManagedRows([row, newRow], columns);

// 셀 선택 상태
const selection = createSelectionState();
const next = setActiveCell(selection, { rowKey: "1", columnKey: "name" });

// 컬럼 상태 초기화
const columnState = createGridColumnState(columns);
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)
- [공개 API 안정성 경계](https://github.com/qoxmfaktmxj/vibe-grid/blob/master/docs/release/public-api-stability.md)
- [Lab 데모](https://grid.minseok91.cloud)

## 라이선스

MIT
