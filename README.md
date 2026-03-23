# VibeGrid

VibeGrid는 EHR 관련 애플리케이션에서 IBSheet 스타일 비즈니스 그리드를 대체하기 위한 독립형 내부 그리드 제품 워크스페이스입니다.

## 이 저장소의 목적

- 페이지 레벨 테이블 위젯이 아닌, 재사용 가능한 비즈니스 그리드 제품 구축
- `TanStack Table`은 내부 엔진 구현 상세로만 유지
- `row-first` HR 워크플로우를 위한 안정적인 앱 대면 API 제공
- `EHR_6` 및 `vibe-hr`로의 본격 마이그레이션 전에 IBSheet 대체 동작 검증

## 워크스페이스 구성

- `apps/playground`: 그리드, 호환성, UX 흐름을 위한 단일 포트 수동 테스트 허브
- `apps/bench`: 대규모 데이터셋 대상 성능 측정 화면
- `packages/core`: 공개 계약, 행 상태, 유효성 검증, 저장 번들, 선택 모델
- `packages/react`: 앱 대면 React 화면
- `packages/tanstack-adapter`: TanStack Table 브릿지
- `packages/virtualization`: sticky/frozen/가상화 오케스트레이션
- `packages/excel`: xlsx 가져오기/내보내기/템플릿 파이프라인
- `packages/clipboard`: 복사/붙여넣기 파싱 및 직사각형 적용
- `packages/testing`: 재사용 가능한 벤치 및 픽스처 헬퍼

## 시작하기

코드를 변경하기 전에 다음 파일을 먼저 읽으세요:

1. `AGENTS.md`
2. `docs/adr/0001-product-scope.md`
3. `docs/development/vibe-grid-development-guide.md`
4. `docs/development/vibe-grid-ai-consumption-guide.md`
5. `docs/roadmap/` 내 최신 슬라이스 문서

현재 활성 참조 문서:

- `docs/design/stitch-design-translation.md`
- `docs/design/design-performance-guardrails.md`
- `docs/development/vibe-grid-ai-consumption-guide.md`
- `docs/roadmap/current-execution-plan.md`
- `docs/release/public-api-stability.md`
- `docs/release/release-routine.md`
- `docs/roadmap/slice-8-range-selection-design.md`
- `docs/roadmap/slice-8-status.md`
- `docs/roadmap/slice-9-productized-grid-ux-design.md`
- `docs/roadmap/slice-9-status.md`
- `docs/roadmap/feature-expansion-backlog.md`
- `docs/development/style-change-bench-checklist.md`

## 안정성 경계

이 저장소의 현재 안정/실험적 경계는 [docs/release/public-api-stability.md](docs/release/public-api-stability.md)를 참고하세요.

요약:

- 파일럿 안정 단계:
  - `@vibe-grid/core` 공유 계약
  - `@vibe-grid/react` 메인 `VibeGrid` 화면
  - 헤더 메뉴, 필터 행, 범위 복사/붙여넣기, 행 가상화
- 아직 실험적:
  - 벤치마크 타이밍 해석
  - 컬럼 상태 이외의 광범위 영속성
  - 테마 토큰 네이밍/상세
  - 비 그리드 랩 셸 프레젠테이션

## 로컬 명령어

```bash
npm install
npm run dev
```

기본 로컬 허브:

- `http://localhost:3203`
- `http://localhost:3203/labs/grid` — 그리드 랩
- `http://localhost:3203/labs/bench` — 벤치마크
- `http://localhost:3203/labs/compatibility` — 호환성 랩

검증 명령어:

```bash
npm run lint
npm run build
npm run ci
npm run test:e2e:smoke
```

새 브라우저 검증 시:

```powershell
$env:CI='1'; npm run test:e2e
```

UI 및 인터랙션 변경 사항은 푸시 전에 반드시 Playwright 브라우저 검증을 포함해야 합니다.

스타일링 변경 시 다음 문서도 함께 검토해야 합니다:

- `docs/design/design-performance-guardrails.md`
- `docs/development/style-change-bench-checklist.md`

여기서 Playwright 검증이란 다음과 같은 실제 브라우저 클릭 및 이벤트 검증을 의미합니다:

- 클릭
- 포커스
- 키보드 입력
- 붙여넣기
- 드래그
- sticky/pinned 인터랙션

## 배포 구성

- Git 저장소 대상: `qoxmfaktmxj/vibe-grid`
- Vercel 프로젝트 루트 디렉토리: `apps/playground`
- 커스텀 도메인 대상: `grid.minseok91.cloud`

상세 배포 절차는 `docs/deployment/vercel-github-deploy.md`에 있습니다.

## 기본 규칙

- 앱에서 TanStack 타입을 직접 의존해서는 안 됩니다.
- 공개 계약은 `@vibe-grid/core`에 속합니다.
- 주요 UX 타겟은 IBSheet 스타일의 row-first 비즈니스 워크플로우입니다.
- VibeGrid가 패리티에 도달할 때까지 `EHR_6`이 비교 대상 앱으로 유지됩니다.
