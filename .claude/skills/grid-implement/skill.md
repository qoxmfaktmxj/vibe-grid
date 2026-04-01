---
name: grid-implement
description: "VibeGrid 패키지에 기능을 구현할 때 사용하는 가이드. 패키지 경계 규칙, TanStack 격리 원칙, core 계약 패턴, row state 관리, 컬럼 정의 패턴을 포함. 그리드 기능 구현, 버그 수정, 패키지 코드 수정 시 반드시 참조."
---

# Grid Implement — VibeGrid 구현 가이드

그리드 기능을 올바른 패키지에 올바른 패턴으로 구현하기 위한 지침.

## 패키지 경계 규칙

코드를 작성하기 전에 "이 코드는 어디에 속하는가?"를 판단한다.

| 코드 유형 | 패키지 | 이유 |
|----------|--------|------|
| 타입 정의, 순수 함수, 상태 로직 | `packages/core` | 프레임워크 무관 공유 계약 |
| React 컴포넌트, 훅, 이벤트 핸들링 | `packages/react` | 렌더링과 인터랙션 |
| 붙여넣기 파싱, 오버플로우 정책 | `packages/clipboard` | 클립보드 도메인 |
| XLSX 가져오기/내보내기 | `packages/excel` | Excel 도메인 |
| 메시지 카탈로그 | `packages/i18n` | ko-KR + en-US 모두 추가 |
| 컬럼 상태 저장 | `packages/persistence` | 브라우저 스토리지 |
| 테마 토큰, 색상 | `packages/theme-shadcn` | 디자인 토큰 |
| TanStack 변환 | `packages/tanstack-adapter` | 내부 어댑터 |
| 가상 스크롤 | `packages/virtualization` | 렌더 최적화 |
| 검증 표면, 랩 페이지 | `apps/playground` | 앱 전용 |

**금지 사항:**
- 앱 전용 로직을 공유 패키지에 넣지 않는다
- TanStack 타입을 core나 react의 public API에 노출하지 않는다
- 랩 전용 동작을 shared package에 실험적으로 넣지 않는다 (experimental 표시 없이)

## Core 계약 패턴

`packages/core`의 함수는 반드시 순수해야 한다:

```typescript
// 좋은 예: 순수 함수, 새 객체 반환
function applyRowPatch<R>(row: ManagedGridRow<R>, patch: Partial<R>): ManagedGridRow<R> {
  return { ...row, data: { ...row.data, ...patch }, _state: row._state === 'N' ? 'U' : row._state };
}

// 나쁜 예: 객체 직접 수정
function applyRowPatch<R>(row: ManagedGridRow<R>, patch: Partial<R>): void {
  Object.assign(row.data, patch);  // 금지: 불변성 위반
}
```

### Row State 패턴

| 상태 | 의미 | 전이 규칙 |
|------|------|----------|
| `N` | Normal (서버에서 로드) | patch → `U`, toggleDelete → `D` |
| `I` | Inserted (새로 추가) | patch → `I` 유지, toggleDelete → 제거 |
| `U` | Updated (수정됨) | patch → `U` 유지, toggleDelete → `D` |
| `D` | Deleted (삭제 표시) | toggleDelete → 원래 상태 복원 |

### Barrel Export 규칙

새 public API를 추가하면 반드시 `src/index.ts`에 export를 추가한다:

```typescript
// packages/core/src/index.ts
export { newFunction, NewType } from './new-module';
```

## React 컴포넌트 패턴

`packages/react`의 컴포넌트는 Props 기반 설정을 따른다:

- VibeGrid의 props로 기능을 제어한다
- 내부 상태는 React hooks로 관리한다
- 키보드/마우스/클립보드 이벤트는 VibeGrid.tsx의 핸들러에서 처리한다
- 내부 서브 컴포넌트(`src/internal/`)는 public export하지 않는다

### data-testid 규칙

Playwright 테스트를 위해 인터랙션 요소에 `data-testid`를 부여한다:

```tsx
<button data-testid="grid-save-button">저장</button>
<tr data-testid={`grid-row-${rowIndex}`}>...</tr>
<th data-column-id={column.id} data-column-pinned={isPinned}>...</th>
```

## 컬럼 정의 패턴

```typescript
const column: VibeGridColumn<MyRow> = {
  id: 'fieldName',
  header: '표시명',
  accessorKey: 'fieldName',
  editable: true,  // 또는 (row) => row._state !== 'D'
  editor: 'text',  // text | select | number | textarea | date
  filterable: true,
  filterEditor: 'text',
  sortable: true,
  width: 150,
  minWidth: 80,
};
```

## 변경 후 필수 확인

1. `packages/core/src/index.ts`에 새 export 추가했는가?
2. TanStack 타입이 public surface에 노출되지 않는가?
3. 새 i18n 메시지가 ko-KR과 en-US 모두에 있는가?
4. Row state 전이가 기존 패턴과 일치하는가?
