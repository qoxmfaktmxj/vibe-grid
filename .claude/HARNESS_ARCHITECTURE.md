# VibeGrid 에이전트 하네스 아키텍처

> 최종 업데이트: 2026-04-01
> 위치: `.claude/HARNESS_ARCHITECTURE.md`

---

## 1. 전체 흐름 요약 

```
┌─────────────────────────────────────────────────────────────────────┐
│                        사용자 요청                                    │
│          "컬럼 추가해줘" / "버그 수정해줘" / "테스트 작성해줘"           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ vibe-orchestrator 스킬 트리거
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1: 분석                                                        │
│                                                                     │
│  ┌────────────┐    AGENTS.md Read Order 따라                         │
│  │  analyst   │──→ 코드/문서 분석 ──→ 01_analyst_requirements.md     │
│  │ (읽기전용) │                                                       │
│  └────────────┘                                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ 분석 결과 확인 후
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 2: 팀 구성 (작업 유형별)                                        │
│                                                                     │
│  코드 변경 + 테스트 → implementer + tester + qa (3명)                  │
│  코드 변경만       → implementer + qa (2명)                           │
│  테스트만          → tester + qa (2명)                                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ TeamCreate
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 3: 구현 + 테스트 (팀 자체 조율)                                  │
│                                                                     │
│  ┌──────────────────┐  SendMessage  ┌──────────────────┐           │
│  │   implementer    │◄─────────────►│     tester       │           │
│  │  (core/react 구현) │  data-testid  │  (E2E 테스트 작성) │           │
│  └────────┬─────────┘  교환         └────────┬─────────┘           │
│           │                                  │                      │
│  02_implementer_changes.md       03_tester_specs.md                 │
│           │                                  │                      │
│           └──────────────┬───────────────────┘                     │
│                          ▼                                          │
│               ┌──────────────────┐                                  │
│               │       qa         │                                  │
│               │ (lint→build→test) │                                 │
│               └──────────────────┘                                  │
│                    04_qa_report.md                                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
           ✅ PASS                   ❌ FAIL
              │                         │
              ▼                         ▼
┌─────────────────────┐   ┌─────────────────────────────────────────┐
│  Phase 5: 정리       │   │  Phase 4: 피드백 루프 (최대 2회)           │
│                     │   │                                         │
│  • 팀 종료           │   │  빌드/타입 에러 → implementer              │
│  • 아티팩트 보존      │   │  E2E 실패      → tester + implementer    │
│  • 결과 보고         │◄──│  경계면 불일치  → implementer             │
│                     │   │  문서 누락      → implementer            │
└─────────────────────┘   │                                         │
                          │  2회 후에도 FAIL → 사용자에게 전달          │
                          └─────────────────────────────────────────┘
```

---

## 2. 에이전트 구성

| 에이전트 | 타입 | 모델 | 역할 | 참조 스킬 | 출력 아티팩트 |
|---------|------|------|------|----------|-------------|
| **analyst** | `vibe-analyst` (읽기전용) | opus | AGENTS.md Read Order 따라 문서·코드 분석, 작업 범위·영향 패키지·계약 변경 여부 파악 | — | `_workspace/01_analyst_requirements.md` |
| **implementer** | `vibe-implementer` | opus | core/react/패키지 코드 구현, TanStack 격리, 패키지 경계 준수 | `grid-implement` | `_workspace/02_implementer_changes.md` |
| **tester** | `vibe-tester` | opus | `tests/e2e/`에 data-testid 기반 Playwright E2E 테스트 작성 | `grid-e2e` | `_workspace/03_tester_specs.md` |
| **qa** | `vibe-qa` | opus | lint→build→test:core→test:e2e 파이프라인, 경계면 교차검증, 문서 정합성 | `grid-verify` | `_workspace/04_qa_report.md` |

---

## 3. 스킬 구성

| 스킬 | 파일 위치 | 역할 |
|------|----------|------|
| `vibe-orchestrator` | `.claude/skills/vibe-orchestrator/skill.md` | 5단계 파이프라인 조율 (오케스트레이터) |
| `grid-implement` | `.claude/skills/grid-implement/skill.md` | 패키지 경계 규칙, Row State N/I/U/D, core 계약 패턴 |
| `grid-e2e` | `.claude/skills/grid-e2e/skill.md` | Playwright 테스트 환경(port 5051), 셀렉터 패턴, 인터랙션 패턴 |
| `grid-verify` | `.claude/skills/grid-verify/skill.md` | 빌드 파이프라인 명령, 경계면 체크리스트, QA 리포트 템플릿 |

---

## 4. 팀 간 통신 (SendMessage 흐름)

```
implementer ──[구현완료 + data-testid 목록]──► tester
tester      ──[data-testid 추가 요청]─────────► implementer
tester      ──[테스트 작성 완료]──────────────► qa
qa          ──[빌드/린트 에러: 파일:라인]───────► implementer
qa          ──[E2E 실패: trace 경로]─────────► tester
qa          ──[경계면 이슈]────────────────────► implementer + tester 모두
오케스트레이터 ──[2회 실패 시 상황 보고]─────────► 사용자 (전달)
```

---

## 5. 데이터 흐름 (아티팩트 체인)

```
[사용자 요청]
     │
     ▼
[analyst]
     │
     └──► _workspace/01_analyst_requirements.md
               │
               ▼
          [implementer]──────────────────────────[tester]
               │                                     │
               └──► _workspace/02_implementer_changes.md
                                                     │
                                       _workspace/03_tester_specs.md
                                                     │
               ┌─────────────────────────────────────┘
               │           (+ 02도 함께)
               ▼
            [qa]
               │
               └──► _workspace/04_qa_report.md
                          │
               ┌──────────┴──────────┐
               │                     │
            ✅ PASS               ❌ FAIL
               │                     │
           결과 보고          피드백 루프 (최대 2회)
                                      │
                              2회 후에도 FAIL
                                      │
                                 사용자에게 전달
```

---

## 6. 패키지 경계 규칙 (implementer 기준)

```
packages/core/          ← 순수 비즈니스 로직 (React 의존성 ❌, 사이드 이펙트 ❌)
packages/react/         ← 렌더링 + 인터랙션 (TanStack 내부에만 사용, public API 노출 ❌)
packages/clipboard/     ← 클립보드 전용
packages/excel/         ← Excel 전용
packages/i18n/          ← ko-KR + en-US 양방향 필수
packages/persistence/   ← 상태 저장
packages/theme-shadcn/  ← 테마
packages/virtualization/ ← 가상화
packages/tanstack-adapter/ ← TanStack 어댑터 (core에서만 내부 사용)
packages/testing/       ← 테스트 헬퍼

apps/playground/        ← 검증 표면 (기능 수동 확인용)
apps/bench/             ← 성능 벤치마크
```

---

## 7. QA 파이프라인 명령 (PowerShell)

```powershell
# 단계별 실행
npm run lint
npm run build
npm run test:core
$env:CI='1'; npm run test:e2e

# 전체 한 번에
$env:CI='1'; npm run ci
```

---

## 8. 피드백 루프 판단 기준

| QA 발견 이슈 | 전달 대상 | 조치 |
|------------|---------|------|
| lint/타입 에러 | implementer | `파일:라인 + 수정 방법` 전달 |
| E2E 테스트 실패 | tester + implementer | `실패 테스트명 + trace 경로` 전달 |
| core barrel 누락 | implementer | `index.ts` export 추가 요청 |
| TanStack 노출 | implementer | public API에서 제거 요청 |
| i18n 키 누락 | implementer | ko-KR/en-US 양쪽 추가 요청 |
| CHANGELOG 누락 | implementer | 항목 추가 요청 |
| 2회 루프 후 FAIL | **사용자** | 현재 상태 보고 + 수동 개입 요청 (전달) |

---

## 9. 트리거 키워드 (vibe-orchestrator 자동 활성화)

**한국어**: 기능 구현, 버그 수정, 컬럼 추가, 에디터 추가, 필터 추가, 그리드 개발
**English**: implement grid feature, fix grid bug, add column/editor/filter, grid development request, VibeGrid monorepo multi-package changes

---

## 10. 파일 위치 맵

```
.claude/
├── HARNESS_ARCHITECTURE.md      ← 이 파일
├── agents/
│   ├── vibe-analyst.md
│   ├── vibe-implementer.md
│   ├── vibe-tester.md
│   └── vibe-qa.md
└── skills/
    ├── vibe-orchestrator/skill.md
    ├── grid-implement/skill.md
    ├── grid-e2e/skill.md
    └── grid-verify/skill.md

_workspace/                      ← 런타임 생성 (작업 추적용, 보존)
├── 01_analyst_requirements.md
├── 02_implementer_changes.md
├── 03_tester_specs.md
└── 04_qa_report.md
```
