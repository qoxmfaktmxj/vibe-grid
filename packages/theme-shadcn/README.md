# @vibe-grid/theme-shadcn

VibeGrid 테마 토큰 생성기. primary color 하나로 그리드 전체 색상 팔레트를 자동 유도합니다.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/theme-shadcn
```

## 빠른 예시

```ts
import { createVibeGridTheme } from "@vibe-grid/theme-shadcn";
import type { VibeGridThemeTokens } from "@vibe-grid/theme-shadcn";

// 기본 테마 (네이비 계열)
const theme = createVibeGridTheme();

// 프로젝트 primary color 적용
const theme = createVibeGridTheme("#0f766e"); // teal
const theme = createVibeGridTheme("#7c3aed"); // violet

// 커스텀 폰트 적용 (소비 앱에서 @font-face 로드 필요)
const theme = createVibeGridTheme("#001641", {
  fontFamily: '"Pretendard", "Noto Sans KR", system-ui, sans-serif',
});

// VibeGrid에 전달
<VibeGrid theme={theme} ... />
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)
- [공개 API 안정성 경계](https://github.com/qoxmfaktmxj/vibe-grid/blob/master/docs/release/public-api-stability.md)
- [Lab 데모](https://grid.minseok91.cloud)

## 라이선스

MIT
