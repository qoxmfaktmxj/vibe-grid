# @vibe-grid/i18n

VibeGrid의 다국어 메시지 카탈로그. 한국어(ko-KR)와 영어(en-US)를 기본 제공합니다.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/i18n
```

## 빠른 예시

```ts
import {
  getGridMessages,
  getGridMessage,
  formatGridMessage,
  gridMessageKeys,
  defaultLocale,
} from "@vibe-grid/i18n";
import type { GridLocale } from "@vibe-grid/i18n";

// 전체 메시지 객체 가져오기
const messages = getGridMessages("en-US");

// 단일 메시지 키 조회
const label = getGridMessage(gridMessageKeys.save, "ko-KR"); // "저장"

// 플레이스홀더 치환
const status = formatGridMessage(
  gridMessageKeys.statusLoadSuccess,
  { reason: "조회", rowCount: 100, totalCount: 500, pageNumber: 1, pageCount: 5 },
  "ko-KR",
);
```

## 지원 로케일

| 코드 | 언어 |
|------|------|
| `ko-KR` | 한국어 (기본값) |
| `en-US` | English |

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)
- [공개 API 안정성 경계](https://github.com/qoxmfaktmxj/vibe-grid/blob/master/docs/release/public-api-stability.md)
- [Lab 데모](https://grid.minseok91.cloud)

## 라이선스

MIT
