# @vibe-grid/persistence

VibeGrid의 컬럼 상태 영속화 어댑터. localStorage/sessionStorage를 통해 컬럼 순서, 너비, 고정, 표시 여부를 저장합니다.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/persistence
```

## 빠른 예시

```ts
import {
  createBrowserGridPreferenceAdapter,
  createGridPreferenceStorageKey,
} from "@vibe-grid/persistence";

// localStorage 어댑터 생성
const adapter = createBrowserGridPreferenceAdapter(localStorage);

const scope = { appId: "my-app", gridId: "employee-grid", userId: "user-123" };

// 컬럼 상태 저장
adapter.setColumnState(scope, columnState);

// 컬럼 상태 불러오기
const saved = adapter.getColumnState(scope);
if (saved) {
  // VibeGrid에 초기 컬럼 상태로 전달
}

// 저장 키 확인 (디버깅용)
const key = createGridPreferenceStorageKey(scope);
// "vibe-grid:my-app:user-123:employee-grid:column-state"
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)
- [공개 API 안정성 경계](https://github.com/qoxmfaktmxj/vibe-grid/blob/master/docs/release/public-api-stability.md)
- [Lab 데모](https://grid.minseok91.cloud)

## 라이선스

MIT
