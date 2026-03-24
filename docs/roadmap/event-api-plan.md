# Event API Plan — IBSheet 대비 VibeGrid 이벤트 계약

## 목적

HR 시스템(인사/급여/조직) 업무 화면에서 필요한 그리드 이벤트를 표준 계약으로 정의한다.
개발자(또는 AI)가 업무 화면을 만들 때 이 계약에 따라 일관된 패턴으로 코드를 작성하도록 강제한다.

## IBSheet8 이벤트 vs VibeGrid 현재 상태

### IBSheet8 주요 이벤트

| IBSheet 이벤트 | 설명 | 단계 |
|---|---|---|
| onRenderFirstFinish | 첫 렌더링 완료 | 렌더 |
| onBeforeDataLoad | 데이터 로드 전 (취소 가능) | 조회 |
| onSearchFinish | 조회 완료 후 | 조회 |
| onBeforeChange | 셀 값 변경 전 (취소/변환 가능) | 편집 |
| onAfterChange | 셀 값 변경 후 | 편집 |
| onStartEdit | 편집 시작 (취소 가능) | 편집 |
| onEndEdit | 편집 종료 (값 변환 가능) | 편집 |
| onAfterClick | 셀/행 클릭 후 | 인터랙션 |
| onBeforeSave | 저장 전 (취소 가능) | 저장 |
| onAfterSave | 저장 후 | 저장 |

### VibeGrid 현재 이벤트 (18개)

| VibeGrid 이벤트 | IBSheet 대응 | 상태 |
|---|---|---|
| `onBeforePaste` | — (IBSheet에 없음) | ✅ experimental |
| `onAfterPaste` | — | ✅ experimental |
| `onAfterSave` | onAfterSave | ✅ experimental |
| `onAfterRowCopy` | — | ✅ experimental |
| `onSelectionStateChange` | — (IBSheet는 이벤트 없음) | ✅ stable |
| `onEditSessionChange` | onStartEdit / onEndEdit 일부 | ✅ stable |
| `onCellEditCommit` | onEndEdit 일부 | ✅ stable |
| `onColumnStateChange` | — | ✅ stable |
| `onSortingChange` | — | ✅ stable |
| `onFiltersChange` | — | ✅ stable |
| `onDeleteCheckToggle` | — | ✅ stable |
| `onClipboardPaste` | — | ✅ stable |
| `tree.onStateChange` | — | ✅ stable |

### 갭 분석 — VibeGrid에 없는 것

| 필요 이벤트 | IBSheet 대응 | HR 시스템 용도 | 우선순위 |
|---|---|---|---|
| **onBeforeChange** | onBeforeChange | 셀 변경 전 유효성 검사, 값 변환, 취소 | 🔴 높음 |
| **onAfterChange** | onAfterChange | 셀 변경 후 연쇄 계산 (급여 자동계산 등) | 🔴 높음 |
| **onBeforeSave** | onBeforeSave | 저장 전 전체 유효성, 취소 | 🔴 높음 |
| **onRowClick** | onAfterClick | 행 클릭 시 상세 패널 연동 | 🟡 중간 |
| **onCellClick** | onAfterClick | 셀 클릭 시 커스텀 액션 (버튼 셀 등) | 🟡 중간 |
| **onBeforeRowInsert** | — | 행 추가 전 기본값 세팅, 취소 | 🟡 중간 |
| **onAfterRowInsert** | — | 행 추가 후 포커스 이동, 서버 알림 | 🟡 중간 |
| **onBeforeRowDelete** | — | 삭제 전 확인, 취소 | 🟡 중간 |
| **onDataLoad** | onSearchFinish | 서버 조회 완료 후 UI 갱신 | 🟢 낮음 |
| **onGridReady** | onRenderFirstFinish | 그리드 초기 렌더 완료 | 🟢 낮음 |

---

## HR 시스템 업무 시나리오별 필요 이벤트

### 1. 급여 명세서 편집

```
사용자가 "기본급" 셀 수정 →
  onBeforeChange: 음수 입력 차단 (return false)
  onAfterChange: 총급여 = 기본급 + 수당 자동 재계산
  onBeforeSave: 전체 행의 급여 합계 검증
  onAfterSave: 서버 저장 성공 → 토스트 알림
```

### 2. 조직도 트리 편집

```
사용자가 "부서명" 편집 →
  onBeforeChange: 중복 부서명 검증
  onAfterChange: 하위 조직 경로명 연쇄 업데이트
  tree.onStateChange: 펼침/접힘 상태 URL 파라미터 동기화
```

### 3. 인사 발령 처리

```
행 추가 →
  onBeforeRowInsert: 발령일 기본값 = 오늘, 발령유형 = "전보"
  onAfterRowInsert: 새 행 첫 편집 가능 셀로 포커스
행 삭제 →
  onBeforeRowDelete: "이미 결재된 발령은 삭제 불가" 확인
  onDeleteCheckToggle: 삭제 마크 토글
저장 →
  onBeforeSave: 필수값 미입력 검증, 날짜 정합성 검증
  onAfterSave: 결재 시스템 연동 API 호출
```

### 4. 근태 현황 조회

```
서버 조회 →
  onDataLoad: 데이터 로드 후 "지각" 행 하이라이트
  onRowClick: 행 클릭 시 해당 사원의 근태 상세 모달 열기
  onCellClick: "승인" 버튼 셀 클릭 시 승인 처리 API 호출
```

---

## 이벤트 계약 설계 원칙

### Before/After 패턴

모든 mutation 이벤트는 Before/After 쌍으로 제공:

```typescript
// Before: 취소 가능 (return false → 중단)
onBeforeChange?: (event: GridBeforeChangeEvent<Row>) => boolean | void;

// After: 연쇄 처리용 (취소 불가)
onAfterChange?: (event: GridAfterChangeEvent<Row>) => void;
```

### 이벤트 파라미터 표준

```typescript
// 모든 이벤트 공통
type GridEventBase = {
  gridId: string;
};

// 셀 수준 이벤트
type GridCellEvent<Row> = GridEventBase & {
  rowKey: string;
  columnKey: string;
  row: Row;
};

// 행 수준 이벤트
type GridRowEvent<Row> = GridEventBase & {
  rowKey: string;
  row: Row;
};
```

### 구현 우선순위

**Phase 1 (즉시)** — 편집/저장 라이프사이클

```
onBeforeChange  →  onAfterChange
onBeforeSave    →  onAfterSave (이미 있음, stable 승격)
```

**Phase 2 (단기)** — 행 조작 라이프사이클

```
onBeforeRowInsert  →  onAfterRowInsert
onBeforeRowDelete  →  onAfterRowDelete
onRowClick
onCellClick
```

**Phase 3 (중기)** — 조회/렌더 라이프사이클

```
onDataLoad
onGridReady
```

---

## 강제 vs AI 자율 판단

### 결론: **표준 계약 강제 + AI가 계약 내에서 자율 구현**

| 항목 | 접근 |
|---|---|
| 이벤트 이름/시그니처 | **강제** — 타입으로 계약 |
| Before 이벤트의 취소 패턴 | **강제** — `return false` = 중단 |
| After 이벤트의 파라미터 구조 | **강제** — `GridEventBase` 상속 |
| 이벤트 안에서의 비즈니스 로직 | **AI 자율** — 시나리오별 다름 |
| 이벤트 조합 패턴 | **가이드 제공** — 위 시나리오 문서 참조 |

### 이유

1. **타입 계약이 없으면** AI가 매번 다른 이름/구조로 만들어서 일관성 깨짐
2. **완전 강제하면** 업무 화면마다 다른 요구사항을 수용 못함
3. **계약 + 자율 조합**이 최적: 구조는 타입이 잡고, 로직은 AI/개발자가 채움

### AI 가이드 문서 위치

이 문서를 `docs/development/vibe-grid-event-contract.md`로 별도 배포하여
AI consumption guide에서 참조하도록 연결한다.

---

## 작업 TODO

- [ ] `GridBeforeChangeEvent` / `GridAfterChangeEvent` 타입 정의 (core)
- [ ] `onBeforeChange` / `onAfterChange` VibeGrid prop 추가 (react)
- [ ] `onBeforeSave` 추가 + `onAfterSave` stable 승격 (core → react)
- [ ] `onRowClick` / `onCellClick` 추가 (react)
- [ ] `onBeforeRowInsert` / `onAfterRowInsert` 추가 (core → react)
- [ ] `onBeforeRowDelete` / `onAfterRowDelete` 추가 (core → react)
- [ ] `onDataLoad` / `onGridReady` 추가 (react)
- [ ] Grid Lab에 이벤트 데모 패널 추가 (playground)
- [ ] Compatibility Lab 매트릭스에 이벤트 행 추가
- [ ] AI consumption guide 이벤트 섹션 추가
- [ ] Playwright: 이벤트 흐름 브라우저 검증

---

*Last updated: 2026-03-24*
