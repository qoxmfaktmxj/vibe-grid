# @vibe-grid/react

VibeGrid의 React 앱 대면 컴포넌트. IBSheet 스타일의 row-first 비즈니스 그리드.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/react react react-dom
```

## 빠른 예시

```tsx
import { VibeGrid, useGridBulkOrchestration, createVibeGridTheme } from "@vibe-grid/react";

const columns = [
  { key: "id", header: "ID" },
  { key: "name", header: "이름", editable: true },
];

const theme = createVibeGridTheme("#0f766e"); // 프로젝트 primary color 적용

function MyGrid() {
  const orchestration = useGridBulkOrchestration({ ... });

  return (
    <VibeGrid
      columns={columns}
      rows={rows}
      theme={theme}
      orchestration={orchestration}
    />
  );
}
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)
- [공개 API 안정성 경계](https://github.com/qoxmfaktmxj/vibe-grid/blob/master/docs/release/public-api-stability.md)
- [Lab/Bench 데모](https://grid.minseok91.cloud)

## 라이선스

MIT
