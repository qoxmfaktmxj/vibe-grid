---
name: vibe-orchestrator
description: "VibeGrid 에이전트 팀을 조율하는 오케스트레이터. 기능 구현, 버그 수정, 성능 최적화 등 그리드 작업 요청 시 analyst → implementer → tester → qa 파이프라인을 에이전트 팀으로 실행한다. '기능 구현해줘', '버그 수정해줘', '그리드 개발' 요청 시 사용. Use for: implement grid feature, fix grid bug, add column/editor/filter, grid development request, VibeGrid monorepo multi-package changes."
---

# Vibe Orchestrator

VibeGrid 에이전트 팀을 조율하여 기능 구현부터 검증까지 전체 파이프라인을 실행하는 통합 스킬.

## 실행 모드: 에이전트 팀

## 에이전트 구성

| 팀원 | 에이전트 타입 | 역할 | 스킬 | 출력 |
|------|-------------|------|------|------|
| analyst | Explore (읽기 전용) | 문서/코드 분석, 범위 파악 | — | `_workspace/01_analyst_requirements.md` |
| implementer | vibe-implementer | core/react 등 구현 | grid-implement | `_workspace/02_implementer_changes.md` |
| tester | vibe-tester | Playwright E2E 작성 | grid-e2e | `_workspace/03_tester_specs.md` |
| qa | vibe-qa | lint/build/e2e 실행, 경계면 검증 | grid-verify | `_workspace/04_qa_report.md` |

## 워크플로우

### Phase 1: 준비 + 분석

1. 사용자 입력 분석 — 작업 유형 파악 (기능 구현 / 버그 수정 / 성능 최적화 / 테스트 추가)
2. `_workspace/` 디렉토리 생성
3. analyst 에이전트를 서브 에이전트로 호출 (Explore 타입, 읽기 전용):
   ```
   Agent(
     subagent_type: "vibe-analyst",
     model: "opus",
     prompt: "사용자 요청: {task}. AGENTS.md Read Order를 따라 관련 문서와 코드를 분석하라.
              결과를 _workspace/01_analyst_requirements.md에 저장하라."
   )
   ```
4. 분석 결과를 Read로 확인

### Phase 2: 팀 구성

1. 분석 결과를 바탕으로 팀 규모 결정:
   - 코드 변경 + 테스트 필요 → implementer + tester + qa (3명)
   - 코드 변경만 → implementer + qa (2명)
   - 테스트만 → tester + qa (2명)

2. 팀 생성:
   ```
   TeamCreate(
     team_name: "vibe-team",
     members: [
       {
         name: "implementer",
         agent_type: "vibe-implementer",
         model: "opus",
         prompt: "_workspace/01_analyst_requirements.md를 읽고 구현을 시작하라.
                  grid-implement 스킬을 참조하라.
                  구현 완료 후 tester에게 SendMessage로 data-testid 정보를 전달하라.
                  결과를 _workspace/02_implementer_changes.md에 저장하라."
       },
       {
         name: "tester",
         agent_type: "vibe-tester",
         model: "opus",
         prompt: "_workspace/01_analyst_requirements.md를 읽고 테스트 시나리오를 파악하라.
                  implementer의 구현 완료 알림을 받으면 E2E 테스트를 작성하라.
                  grid-e2e 스킬을 참조하라.
                  결과를 _workspace/03_tester_specs.md에 저장하라."
       },
       {
         name: "qa",
         agent_type: "vibe-qa",
         model: "opus",
         prompt: "implementer와 tester의 작업 완료를 기다린 후 검증을 시작하라.
                  grid-verify 스킬을 참조하라.
                  lint → build → test:core → test:e2e 순서로 실행하라.
                  경계면 교차 검증과 문서 정합성을 확인하라.
                  결과를 _workspace/04_qa_report.md에 저장하라."
       }
     ]
   )
   ```

3. 작업 등록:
   ```
   TaskCreate(tasks: [
     { title: "기능 구현", description: "analyst 분석 기반 코드 구현", assignee: "implementer" },
     { title: "E2E 테스트 작성", description: "구현된 기능의 Playwright 테스트", assignee: "tester", depends_on: ["기능 구현"] },
     { title: "품질 검증", description: "빌드 파이프라인 + 경계면 + 문서", assignee: "qa", depends_on: ["기능 구현", "E2E 테스트 작성"] }
   ])
   ```

### Phase 3: 구현 + 테스트

**실행 방식:** 팀원들이 자체 조율

팀원 간 통신 규칙:
- implementer → tester: 구현 완료 시 SendMessage (변경된 파일, data-testid 정보)
- tester → implementer: 필요한 data-testid 추가 요청 SendMessage
- tester → qa: 테스트 작성 완료 알림 SendMessage
- qa → implementer: 빌드/린트 에러 발견 시 SendMessage (파일:라인 + 수정 방법)
- qa → tester: E2E 실패 시 SendMessage (실패 내용 + trace 경로)

리더 모니터링:
- 팀원이 유휴 상태가 되면 자동 알림 수신
- 진행률은 TaskGet으로 확인
- 특정 팀원이 막혔으면 SendMessage로 지원

### Phase 4: 피드백 루프

1. qa의 검증 리포트를 Read로 확인
2. PASS → Phase 5로 진행
3. FAIL → 이슈를 해당 팀원에게 SendMessage로 전달
   - 빌드/타입 에러 → implementer
   - E2E 실패 → tester + implementer
   - 경계면 불일치 → implementer
   - 문서 누락 → implementer
4. 수정 완료 후 qa에게 재검증 요청
5. 최대 2회 루프. 2회 후에도 FAIL이면 사용자에게 에스컬레이션

### Phase 5: 정리

1. 팀원들에게 종료 요청 (SendMessage)
2. 팀 정리 (TeamDelete)
3. `_workspace/` 디렉토리 보존 (감사 추적용)
4. 사용자에게 결과 요약 보고:
   - 변경된 파일 목록
   - 추가/수정된 테스트 목록
   - QA 검증 결과
   - 업데이트된 문서 목록

## 데이터 흐름

```
[사용자 요청]
     ↓
[analyst] → 01_requirements.md
     ↓
[리더] → TeamCreate
     ↓
[implementer] ←SendMessage→ [tester]
     │                         │
     ↓                         ↓
02_changes.md            03_specs.md
     │                         │
     └────────→ [qa] ←────────┘
                  ↓
           04_qa_report.md
                  ↓
            PASS → 완료
            FAIL → 피드백 루프
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| analyst 분석 모호 | 리더가 사용자에게 명확화 질문 |
| implementer 실패 | 리더가 SendMessage로 에러 확인 → 힌트 제공 |
| tester 실패 | implementer에게 구현 의도 재확인 요청 |
| qa 빌드 실패 | 에러를 implementer에게 전달, 1회 재시도 |
| 2회 피드백 후에도 FAIL | 사용자에게 현재 상태 보고 + 수동 개입 요청 |
| 팀원 간 데이터 충돌 | 양쪽 의견 병기, 리더가 판단 |

## 테스트 시나리오

### 정상 흐름
1. 사용자: "sortOrder 컬럼에 number editor 추가해줘"
2. Phase 1: analyst가 core contracts, react VibeGrid, grid-lab model 분석
3. Phase 2: 3명 팀 구성 + 3개 작업 등록
4. Phase 3: implementer가 editor 추가 → tester가 E2E 작성 → qa가 검증
5. Phase 4: qa PASS
6. Phase 5: 팀 정리, 결과 보고
7. 산출물: 변경 파일 + E2E 스펙 + QA 리포트

### 에러 흐름
1. 사용자: "필터 행에 date range 필터 추가"
2. Phase 3: implementer가 구현 완료, qa가 빌드 실행 → lint 실패
3. Phase 4: qa가 implementer에게 에러 전달 → implementer 수정 → qa 재검증 → PASS
4. Phase 5: 정상 정리

### 에스컬레이션 흐름
1. Phase 4: 2회 피드백 후에도 타입 에러 미해결
2. 리더가 사용자에게 보고: "packages/core/src/contracts.ts의 GridFilter 타입 변경이 clipboard 패키지와 호환되지 않습니다. 수동 검토가 필요합니다."
3. 사용자 지시 후 추가 수정
