# VibeGrid

[![npm version](https://img.shields.io/npm/v/@vibe-grid/react.svg)](https://www.npmjs.com/package/@vibe-grid/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

```bash
npm install @vibe-grid/react react react-dom
```

VibeGrid는 EHR 관련 애플리케이션에서 IBSheet 스타일 비즈니스 그리드를 대체하기 위한 독립형 내부 그리드 제품 워크스페이스입니다.

---

## 목적

- 페이지 레벨 테이블 위젯이 아닌, 재사용 가능한 비즈니스 그리드 제품 구축
- `TanStack Table`은 내부 엔진 구현 상세로만 유지 — 앱에 노출 금지
- `row-first` HR 워크플로우를 위한 안정적인 앱 대면 API 제공
- `EHR_6` 및 `vibe-hr`로의 본격 마이그레이션 전에 IBSheet 대체 동작 검증

---

## 워크스페이스 구성

### 앱

| 디렉토리 | 역할 |
|---------|------|
| `apps/playground` | 그리드, 호환성, UX 흐름 검증 플랫폼 |
| `apps/bench` | 대규모 데이터셋 대상 성능 측정 화면 |

### 패키지

| 패키지 | 역할 | npm |
|--------|------|-----|
| `packages/core` | 공개 계약, 행 상태, 유효성 검증, 선택 모델 — 순수 함수만 포함 | [@vibe-grid/core](https://www.npmjs.com/package/@vibe-grid/core) |
| `packages/react` | 앱 대면 React 컴포넌트 (`VibeGrid`) | [@vibe-grid/react](https://www.npmjs.com/package/@vibe-grid/react) |
| `packages/tanstack-adapter` | TanStack Table 브릿지 (internal) | [(internal)](https://www.npmjs.com/package/@vibe-grid/tanstack-adapter) |
| `packages/virtualization` | sticky/frozen/가상화 오케스트레이션 (internal) | [(internal)](https://www.npmjs.com/package/@vibe-grid/virtualization) |
| `packages/clipboard` | 복사/붙여넣기 파싱 및 직사각형 적용 | [@vibe-grid/clipboard](https://www.npmjs.com/package/@vibe-grid/clipboard) |
| `packages/excel` | xlsx 가져오기/내보내기/템플릿 파이프라인 | [@vibe-grid/excel](https://www.npmjs.com/package/@vibe-grid/excel) |
| `packages/i18n` | ko-KR / en-US 다국어 메시지 | [@vibe-grid/i18n](https://www.npmjs.com/package/@vibe-grid/i18n) |
| `packages/persistence` | 컬럼 상태 직렬화 및 복원 | [@vibe-grid/persistence](https://www.npmjs.com/package/@vibe-grid/persistence) |
| `packages/theme-shadcn` | shadcn/ui 기반 테마 토큰 | [@vibe-grid/theme-shadcn](https://www.npmjs.com/package/@vibe-grid/theme-shadcn) |
| `packages/testing` | 재사용 가능한 벤치 및 픽스처 헬퍼 | — (private) |

---

## 시작하기

코드를 변경하기 전에 다음 순서로 읽으세요:

1. [`AGENTS.md`](./AGENTS.md) — AI 에이전트 작업 규칙 및 Read Order
2. [`docs/adr/0001-product-scope.md`](./docs/adr/0001-product-scope.md) — 제품 범위 결정
3. [`docs/development/vibe-grid-development-guide.md`](./docs/development/vibe-grid-development-guide.md) — 개발 규칙
4. [`docs/development/vibe-grid-ai-consumption-guide.md`](./docs/development/vibe-grid-ai-consumption-guide.md) — AI 협업 가이드
5. [`docs/roadmap/current-execution-plan.md`](./docs/roadmap/current-execution-plan.md) — 현재 실행 우선순위

### 설계 참조 문서

| 문서 | 내용 |
|------|------|
| [`docs/release/public-api-stability.md`](./docs/release/public-api-stability.md) | stable / experimental 경계 |
| [`docs/design/stitch-design-translation.md`](./docs/design/stitch-design-translation.md) | UI 설계 번역 규칙 |
| [`docs/design/design-performance-guardrails.md`](./docs/design/design-performance-guardrails.md) | CSS 성능 위험도 분류 |
| [`docs/roadmap/slice-9-status.md`](./docs/roadmap/slice-9-status.md) | 현재 슬라이스 진행 상태 |
| [`docs/roadmap/feature-expansion-backlog.md`](./docs/roadmap/feature-expansion-backlog.md) | 기능 확장 백로그 |

---

## 로컬 개발

```bash
npm install
npm run dev
```

로컬 허브:

| 주소 | 내용 |
|------|------|
| `http://localhost:5050` | Playground 메인 |
| `http://localhost:5050/labs/grid` | 그리드 랩 |
| `http://localhost:5050/labs/bench` | 벤치마크 |
| `http://localhost:5050/labs/compatibility` | 호환성 랩 |

---

## 검증

```bash
npm run lint        # 린트
npm run build       # 빌드
npm run test:core   # 코어 유닛 테스트
npm run ci          # 전체 파이프라인
```

E2E 테스트 (fresh-browser 모드):

```powershell
$env:CI='1'; npm run test:e2e
```

UI 및 인터랙션 변경 시 푸시 전 Playwright 브라우저 검증 필수:
클릭, 포커스, 키보드 입력, 붙여넣기, 드래그, sticky/pinned 인터랙션

스타일 변경 시 함께 검토:
- [`docs/design/design-performance-guardrails.md`](./docs/design/design-performance-guardrails.md)
- [`docs/development/style-change-bench-checklist.md`](./docs/development/style-change-bench-checklist.md)

---

## 안정성 경계

상세 내용: [`docs/release/public-api-stability.md`](./docs/release/public-api-stability.md)

| 상태 | 항목 |
|------|------|
| ✅ 파일럿 안정 | `@vibe-grid/core` 공유 계약, `@vibe-grid/react` VibeGrid 컴포넌트, 헤더 메뉴, 필터 행, 범위 복사/붙여넣기, 행 가상화 |
| 🧪 실험적 | 벤치마크 타이밍 해석, 컬럼 상태 이외의 광범위 영속성, 테마 토큰 네이밍, 비 그리드 랩 셸 프레젠테이션 |

> SemVer: `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다. Pilot 단계 이후 `1.0.0` 발표 시 안정 contract로 전환합니다.

---

## AI 에이전트 하네스

`.claude/` 디렉토리에 VibeGrid 전용 에이전트 팀 하네스가 구성되어 있습니다.

### 에이전트

| 에이전트 | 역할 |
|---------|------|
| `vibe-analyst` | 코드/문서 분석, 작업 범위 파악 (읽기 전용) |
| `vibe-implementer` | core/react/패키지 기능 구현 |
| `vibe-tester` | Playwright E2E 테스트 작성 |
| `vibe-qa` | lint → build → test 파이프라인 + 경계면 검증 |

### 스킬

| 스킬 | 역할 |
|------|------|
| `vibe-orchestrator` | 기능 구현 요청 시 4명 팀 자동 조율 |
| `grid-implement` | 패키지 경계 규칙, Row State 패턴, core 계약 |
| `grid-e2e` | Playwright 셀렉터 패턴, 테스트 환경 설정 |
| `grid-verify` | QA 체크리스트, 경계면 교차검증, 리포트 형식 |

트리거: "기능 구현해줘", "버그 수정해줘", "컬럼 추가해줘" 등 그리드 개발 요청

전체 아키텍처: [`.claude/HARNESS_ARCHITECTURE.md`](./.claude/HARNESS_ARCHITECTURE.md)

---

## Release

GitHub Actions의 `release.yml`이 `v*.*.*` 태그 push 시 자동으로 lint/build/test 후 npm 발행합니다.

```bash
# 1) 모든 패키지 + 루트 버전 일괄 bump
npm version 0.1.1 -ws --include-workspace-root --no-git-tag-version

# 2) CHANGELOG.md 갱신 후 커밋
git commit -am "chore(release): 0.1.1"

# 3) 태그 + 푸시 → Actions 자동 트리거
git tag -a v0.1.1 -m "Release 0.1.1"
git push origin master --follow-tags
```

자세한 절차는 [`docs/superpowers/specs/2026-04-27-vibe-grid-npm-publish-design.md`](./docs/superpowers/specs/2026-04-27-vibe-grid-npm-publish-design.md) §7 참조.

---

## 배포

- Git 저장소: `qoxmfaktmxj/vibe-grid`
- Vercel 루트 디렉토리: `apps/playground`
- 커스텀 도메인: `grid.minseok91.cloud`

상세 절차: [`docs/deployment/vercel-github-deploy.md`](./docs/deployment/vercel-github-deploy.md)

---

## 핵심 규칙

- 앱에서 TanStack 타입을 직접 의존하지 않는다
- 공개 계약은 `@vibe-grid/core`에만 정의한다
- 주요 UX 타겟은 IBSheet 스타일 row-first 비즈니스 워크플로우다
- VibeGrid가 패리티에 도달할 때까지 `EHR_6`이 비교 대상 앱으로 유지된다
