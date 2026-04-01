---
name: grid-verify
description: "VibeGrid 변경 검증 체크리스트. lint/build/test:core/test:e2e 파이프라인 실행, 패키지 경계면 교차 검증, 문서 정합성(CHANGELOG, 안정성 경계, 로드맵), 성능 벤치 검증을 포함. 코드 변경 후 품질 게이트로 반드시 사용."
---

# Grid Verify — 변경 검증 체크리스트

VibeGrid 코드 변경 후 품질을 검증하기 위한 체계적 체크리스트.

## 빌드 파이프라인 (필수)

모든 변경에 대해 순서대로 실행한다. 하나라도 실패하면 수정 후 재실행한다.

```powershell
# 1단계: 린트
npm run lint

# 2단계: 빌드
npm run build

# 3단계: 코어 유닛 테스트
npm run test:core

# 4단계: E2E 테스트 (CI 모드 필수)
$env:CI='1'; npm run test:e2e
```

CI 모드를 사용하는 이유: 로컬 서버 캐시를 방지하고, 저장소의 fresh-browser 검증 규칙과 일치시키기 위함이다.

전체 파이프라인 한 번에 실행:
```powershell
$env:CI='1'; npm run ci
```

## 패키지 경계면 교차 검증

"존재 확인"이 아닌 "교차 비교"를 수행한다. 한쪽만 읽지 말고 양쪽을 동시에 읽어 비교한다.

### core export ↔ 하위 패키지 import

| 왼쪽 (생산자) | 오른쪽 (소비자) | 검증 내용 |
|-------------|---------------|----------|
| `packages/core/src/index.ts` export | `packages/react` import | 새 export가 barrel에 포함되었는가? |
| core 타입 정의 변경 | react, clipboard 등에서 사용 | 타입 변경이 하위 패키지에서 정상 컴파일되는가? |

### TanStack 격리

```
검증: packages/core/src/index.ts와 packages/react/src/index.ts에서
@tanstack/* 타입이 export되지 않는지 확인
```

### i18n 양방향

```
검증: 새 메시지 키가 추가되었으면
packages/i18n/src/index.ts에서 ko-KR과 en-US 모두에 존재하는지 확인
```

## 문서 정합성

코드 변경과 문서가 일치하는지 확인한다.

| 조건 | 필요한 문서 업데이트 |
|------|------------------|
| 의미 있는 기능/수정 | `CHANGELOG.md` |
| stable API 변경 | `docs/release/public-api-stability.md` |
| experimental → stable 승격 | `docs/release/public-api-stability.md` |
| 로드맵 진행 | 해당 `docs/roadmap/*-status.md` |
| 실행 우선순위 변경 | `docs/roadmap/current-execution-plan.md` |

## 성능 벤치 검증 (스타일 변경 시)

`docs/design/design-performance-guardrails.md` 기준으로 분류한다.

| 위험도 | CSS 속성 | 벤치 필요 |
|--------|---------|----------|
| 저위험 | color, border, padding, margin, font | 불필요 |
| 고위험 | backdrop-filter, box-shadow, overlay, per-cell effect | 필수 |
| 구조 변경 | sticky, z-index, compositing layer | 필수 |

고위험 변경 시: `apps/bench` 또는 Playground의 Bench Lab에서 100K행 시나리오 실행 후 상대적 성능 비교.

## QA 리포트 형식

검증 완료 후 다음 형식으로 리포트를 작성한다:

```markdown
# QA 검증 리포트

## 빌드 파이프라인
| 단계 | 결과 | 비고 |
|------|------|------|
| lint | ✅ PASS / ❌ FAIL | 에러 내용 |
| build | ✅ PASS / ❌ FAIL | |
| test:core | ✅ PASS / ❌ FAIL | |
| test:e2e | ✅ PASS / ❌ FAIL | 실패한 테스트명 |

## 경계면 검증
| 항목 | 결과 | 상세 |
|------|------|------|
| core barrel export | ✅ / ❌ | |
| TanStack 격리 | ✅ / ❌ | |
| i18n 양방향 | ✅ / ❌ / N/A | |

## 문서 정합성
| 항목 | 결과 |
|------|------|
| CHANGELOG | ✅ / ❌ / N/A |
| 안정성 경계 | ✅ / ❌ / N/A |
| 로드맵 | ✅ / ❌ / N/A |

## 최종 판정: PASS / FAIL

## 발견된 이슈
| 심각도 | 파일 | 이슈 | 수정 방법 |
|--------|------|------|----------|
```

## 실패 대응

| 실패 유형 | 대응 |
|----------|------|
| lint 실패 | 에러 메시지 파싱 → implementer에게 파일:라인 + 수정 방법 전달 |
| build 실패 | 타입 에러 파싱 → implementer에게 전달 |
| test:core 실패 | 실패한 테스트와 assertion 메시지 → implementer에게 전달 |
| test:e2e 실패 | 실패 테스트명 + trace 경로 → tester와 implementer에게 전달 |
| 경계면 불일치 | 양쪽 파일 경로 + 불일치 내용 → implementer에게 전달 |
| 문서 누락 | 필요한 문서와 업데이트 내용 → implementer에게 전달 |
