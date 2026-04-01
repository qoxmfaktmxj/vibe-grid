---
name: grid-e2e
description: "VibeGrid Playwright E2E 테스트 작성 가이드. 그리드 인터랙션(클릭, 키보드, 붙여넣기, 드래그, 필터, 정렬, 핀, 가상화) 테스트 패턴, data-testid 셀렉터 규칙, 기존 스펙 구조를 포함. E2E 테스트 작성, 수정, 디버깅 시 반드시 참조."
---

# Grid E2E — Playwright 테스트 작성 가이드

VibeGrid의 Playwright E2E 테스트를 올바른 패턴으로 작성하기 위한 지침.

## 테스트 환경

| 항목 | 값 |
|------|---|
| 테스트 디렉토리 | `tests/e2e/` |
| 대상 URL | `http://127.0.0.1:5051` (Playground 앱) |
| 브라우저 | Chromium only |
| Worker | 1 (순차 실행, 상태 간섭 방지) |
| 타임아웃 | test 30s, expect 10s |
| 실행 명령 | `$env:CI='1'; npm run test:e2e` |

## 셀렉터 규칙

Playwright 셀렉터는 `data-testid`와 `data-*` 속성을 사용한다. CSS 클래스 기반 셀렉터는 스타일 변경에 취약하므로 금지한다.

### 핵심 셀렉터 패턴

```typescript
// 그리드 루트
const grid = page.getByTestId("vibe-grid");

// 그리드 속성 읽기
await grid.getAttribute("data-total-row-count");
await grid.getAttribute("data-selected-row-count");
await grid.getAttribute("data-density");
await grid.getAttribute("data-row-height");

// 커맨드 버튼
page.getByTestId("command-insert");
page.getByTestId("command-save");
page.getByTestId("command-copyRow");

// 셀 (패턴: grid-cell-{rowKey}-{columnId})
page.getByTestId("grid-cell-HR-001-sampleCode");

// 행 체크박스
page.getByTestId("row-check-HR-001");
page.getByTestId("header-check-all");

// 삭제 체크
page.getByTestId("delete-check-HR-001");

// 헤더 메뉴
page.getByTestId("header-menu-trigger-sampleCode");

// 필터 행
page.locator('[data-column-filtered="true"]');

// 핀 상태
page.locator('[data-column-pinned="left"]');

// 저장 번들 미리보기
page.getByTestId("save-bundle-preview");
```

### 헤더 속성 패턴

```typescript
// 헤더 셀의 data-* 속성으로 상태 확인
const header = page.locator(`th[data-column-id="${columnId}"]`);
await expect(header).toHaveAttribute("data-column-pinned", "left");
await expect(header).toHaveAttribute("data-column-filtered", "true");
```

## 인터랙션 테스트 패턴

### 클릭 + 확인

```typescript
await page.getByTestId("command-insert").click();
await expect(grid).toHaveAttribute(
  "data-total-row-count",
  String(initialRowCount + 1),
);
```

### 키보드 인터랙션

```typescript
// 범위 선택
await page.getByTestId("grid-cell-HR-001-sampleCode").click();
await page.keyboard.down("Shift");
await page.keyboard.press("ArrowDown");
await page.keyboard.press("ArrowRight");
await page.keyboard.up("Shift");

// 복사
await page.keyboard.press("Control+c");
```

### 붙여넣기 테스트

```typescript
// 붙여넣기 텍스트 영역을 사용한 테스트
await page.getByTestId("paste-row-overflow-policy").selectOption("append");
await page.getByTestId("paste-textarea").fill(
  ["HR-901\tAlpha\tDept\tTitle\tY\t901\tNote"].join("\n"),
);
await page.getByTestId("paste-apply").click();
```

### 드래그 범위 선택

```typescript
const startCell = page.getByTestId("grid-cell-HR-001-sampleCode");
const endCell = page.getByTestId("grid-cell-HR-003-department");
await startCell.dragTo(endCell);
```

### 필터 검증

```typescript
const filterInput = page.getByTestId("filter-input-sampleName");
await filterInput.fill("홍");
await filterInput.press("Enter");
await expect(grid).toHaveAttribute("data-total-row-count", "2");
```

### 가상화 행 수 검증

```typescript
// 렌더된 행 수가 전체보다 적은지 확인 (가상화 작동)
const renderedRows = await page.locator("tbody tr").count();
const totalRows = Number(await grid.getAttribute("data-total-row-count"));
expect(renderedRows).toBeLessThan(totalRows);
```

## 테스트 구조

```typescript
import { expect, test } from "@playwright/test";

test.describe("Feature Name", () => {
  test("describes the specific behavior being verified", async ({ page }) => {
    // 1. 네비게이션
    await page.goto("/labs/grid");

    // 2. 그리드 참조
    const grid = page.getByTestId("vibe-grid");

    // 3. 초기 상태 확인
    await expect(grid).toBeVisible();

    // 4. 인터랙션 수행
    // ...

    // 5. 결과 검증
    // ...
  });
});
```

## 기존 스펙 파일 구조

| 파일 | 커버리지 |
|------|---------|
| `hub-smoke.spec.ts` | 전체 랩 네비게이션 스모크 |
| `grid-lab.spec.ts` | 코어 행 워크플로우, 붙여넣기, 필터, 범위선택, 가상화 |
| `grid-header-menu.spec.ts` | 헤더 메뉴 열기, 정렬/핀/숨김/리셋 |
| `employee-batch.spec.ts` | 벌크 오케스트레이션, 선택 스냅샷, 뮤테이션 |
| `bench.spec.ts` | 성능 경로 (100K행, 밀도, 핀, 복합 기능) |
| `compatibility.spec.ts` | IBSheet 호환 검증 |

## 안정성 규칙

- 비결정적(flaky) 테스트를 방지하라:
  - 요소가 나타날 때까지 `expect(locator).toBeVisible()` 대기
  - 행 수 변경은 `toHaveAttribute`로 대기 (암시적 대기 활용)
  - 애니메이션 완료 대기가 필요하면 `expect.poll()` 사용
- `.only`는 CI에서 금지된다 (`forbidOnly: !!process.env.CI`)
- CI에서 1회 재시도 활성화 (`retries: 1`)
- 실패 시 trace, screenshot, video가 자동 캡처된다

## 새 테스트 추가 체크리스트

1. 기존 스펙 파일에 추가할지, 새 파일을 만들지 판단
2. `data-testid` 기반 셀렉터 사용
3. 필요한 `data-testid`가 없으면 implementer에게 추가 요청
4. 테스트명은 검증하는 동작을 구체적으로 설명
5. `$env:CI='1'; npm run test:e2e` 로 전체 스위트 통과 확인
