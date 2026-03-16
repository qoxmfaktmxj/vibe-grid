import Link from "next/link";
import type { Route } from "next";
import {
  buildGridGroupPreview,
  buildGridPivotPreview,
  flattenGridTree,
  type GridTreeNode,
} from "@vibe-grid/core";
import { CompatibilityTreeRuntimeDemo } from "./CompatibilityTreeRuntimeDemo";

type CompatStatus = "done" | "partial" | "next";

const ibsheetSources = [
  {
    doc: "basic-course.html",
    focus: "조회, 저장, 페이지 구조와 기본 이벤트 흐름",
  },
  {
    doc: "header.html",
    focus: "헤더, HeaderCheck, 컬럼 제어",
  },
  {
    doc: "init-structure.html",
    focus: "필터, 그룹, 트리, 고정 컬럼",
  },
  {
    doc: "on-before-paste.html / on-after-paste.html",
    focus: "붙여넣기 전후 lifecycle",
  },
  {
    doc: "on-after-save.html",
    focus: "저장 완료 이후 lifecycle",
  },
  {
    doc: "on-after-row-copy.html",
    focus: "행 복사 이후 lifecycle",
  },
] as const;

const scenarioLinks: Array<{
  href: Route;
  title: string;
  description: string;
}> = [
  {
    href: "/labs/grid",
    title: "Grid Lab",
    description: "실제 업무형 CRUD, 붙여넣기, 저장 번들, public event를 확인합니다.",
  },
  {
    href: "/labs/bench",
    title: "Bench",
    description: "10k / 50k / 100k 기준에서 실제 VibeGrid 경로와 결합 성능을 확인합니다.",
  },
] as const;

const matrix: Array<{
  feature: string;
  ibsheet: string;
  vibeGrid: string;
  status: CompatStatus;
  nextStep: string;
  source: string;
}> = [
  {
    feature: "행 선택 + 범위 선택 + 복사/붙여넣기",
    ibsheet: "업무형 시트 UX에서 범위 선택과 클립보드 작업을 제공",
    vibeGrid: "행 선택, 범위 선택, 범위 복사/붙여넣기, overflow 정책까지 구현",
    status: "done",
    nextStep: "drag polish와 event payload 세부 항목 보강",
    source: "basic-course / on-before-paste / on-after-paste",
  },
  {
    feature: "저장 번들 / 변경 상태 분리",
    ibsheet: "추가, 수정, 삭제 상태를 분리한 저장 구조 제공",
    vibeGrid: "inserted / updated / deleted diff bundle과 row state 제공",
    status: "done",
    nextStep: "host callback naming만 추가 정리",
    source: "basic-course / on-after-save",
  },
  {
    feature: "헤더 메뉴 / 정렬 / 숨김 / 고정 / 폭 초기화",
    ibsheet: "헤더 중심 컬럼 제어",
    vibeGrid: "헤더 메뉴에서 정렬, 숨김, 좌우 고정, 폭 초기화 지원",
    status: "done",
    nextStep: "right-click 정책과 indicator 표현 추가 보강",
    source: "header",
  },
  {
    feature: "in-grid filter row / 조회 경로",
    ibsheet: "헤더 아래 필터 입력과 조회 흐름 제공",
    vibeGrid: "text/select/number filter row와 query path 연동 지원",
    status: "done",
    nextStep: "saved filter preset은 추후 제품화",
    source: "init-structure / basic-course",
  },
  {
    feature: "xlsx import / export / template",
    ibsheet: "업로드, 다운로드, 양식 배포 제공",
    vibeGrid: "xlsx export, template, import preview, 헤더 검증까지 지원",
    status: "done",
    nextStep: "server adapter는 추후 분리",
    source: "basic-course",
  },
  {
    feature: "delete-check 기반 삭제 의도 표시",
    ibsheet: "삭제 대상 표시 후 저장 반영 패턴",
    vibeGrid: "delete-check internal column으로 삭제 의도 분리",
    status: "done",
    nextStep: "다른 의미의 선택 체크 컬럼은 별도 기능으로 분리",
    source: "basic-course",
  },
  {
    feature: "실제 경로 대용량 성능 검증",
    ibsheet: "업무 기능이 결합된 상태의 체감 성능 정보",
    vibeGrid: "actual render path row virtualization과 bench 상호작용 지표 제공",
    status: "done",
    nextStep: "latency band를 팀 기준값으로 고정",
    source: "init-structure",
  },
  {
    feature: "날짜 editor + host date policy",
    ibsheet: "업무 정책을 반영한 날짜 편집 가능",
    vibeGrid: "날짜 editor foundation과 host holiday/date policy helper 제공",
    status: "partial",
    nextStep: "host 예제와 disabled reason UX 보강",
    source: "basic-course",
  },
  {
    feature: "행 복사 lifecycle parity",
    ibsheet: "행 복사 이후 public lifecycle 제공",
    vibeGrid: "onAfterRowCopy experimental public surface 제공",
    status: "partial",
    nextStep: "stable payload naming 정리",
    source: "on-after-row-copy",
  },
  {
    feature: "붙여넣기 lifecycle parity",
    ibsheet: "onBeforePaste / onAfterPaste 이벤트 제공",
    vibeGrid: "onBeforePaste / onAfterPaste experimental public surface 제공",
    status: "partial",
    nextStep: "cancel / payload 정책을 stable로 고정",
    source: "on-before-paste / on-after-paste",
  },
  {
    feature: "저장 lifecycle parity",
    ibsheet: "onAfterSave 저장 완료 이벤트 제공",
    vibeGrid: "onAfterSave experimental public surface 제공",
    status: "partial",
    nextStep: "host save contract를 stable로 정리",
    source: "on-after-save",
  },
  {
    feature: "HeaderCheck 전체 체크",
    ibsheet: "헤더 체크로 전체 행 선택/해제",
    vibeGrid: "rowCheck internal column과 header all-check 제공",
    status: "done",
    nextStep: "visible row / filtered row 정책 세분화",
    source: "header",
  },
  {
    feature: "Tree runtime MVP",
    ibsheet: "트리 행 확장/축소와 계층 구조 렌더 지원",
    vibeGrid: "실제 VibeGrid runtime 경로에서 tree spec + expanded state + toggle 렌더 제공",
    status: "partial",
    nextStep: "selection / range / bench 규칙까지 올려서 runtime 완성도 상승",
    source: "init-structure",
  },
  {
    feature: "Group / Pivot 계열",
    ibsheet: "그룹, 피벗형 시각화 지원",
    vibeGrid: "compatibility lab에서 experimental group/pivot preview 제공",
    status: "partial",
    nextStep: "Tree runtime 안정화 이후 group 승격, pivot은 experimental 유지",
    source: "userGuide/group / userGuide/pivot",
  },
  {
    feature: "IBSheet public event parity",
    ibsheet: "paste/save/copy 관련 이벤트 계약 제공",
    vibeGrid: "Grid Lab에서 experimental public event surface와 event log 제공",
    status: "partial",
    nextStep: "stable API로 승격할 payload와 네이밍 정리",
    source: "on-before-paste / on-after-paste / on-after-save / on-after-row-copy",
  },
] as const;

const statusLabel: Record<CompatStatus, string> = {
  done: "구현 완료",
  partial: "부분 구현",
  next: "다음 단계",
};

const doneCount = matrix.filter((item) => item.status === "done").length;
const partialCount = matrix.filter((item) => item.status === "partial").length;
const nextCount = matrix.filter((item) => item.status === "next").length;

const experimentalRows = [
  { employeeNo: "E-001", department: "인사운영", jobTitle: "매니저", amount: 120 },
  { employeeNo: "E-002", department: "인사운영", jobTitle: "리드", amount: 80 },
  { employeeNo: "E-003", department: "보상기획", jobTitle: "매니저", amount: 95 },
  { employeeNo: "E-004", department: "보상기획", jobTitle: "리드", amount: 70 },
];

const treeNodes: GridTreeNode<{
  department: string;
  headcount: number;
}>[] = [
  {
    id: "org-root",
    label: "본사",
    row: { department: "본사", headcount: 42 },
    children: [
      {
        id: "org-hr",
        label: "인사본부",
        row: { department: "인사본부", headcount: 18 },
        children: [
          {
            id: "org-hr-ops",
            label: "인사운영팀",
            row: { department: "인사운영팀", headcount: 9 },
          },
          {
            id: "org-hr-reward",
            label: "보상기획팀",
            row: { department: "보상기획팀", headcount: 9 },
          },
        ],
      },
    ],
  },
];

const groupedPreview = buildGridGroupPreview(experimentalRows, "department");
const treePreview = flattenGridTree(treeNodes);
const pivotPreview = buildGridPivotPreview(experimentalRows, {
  rowField: "department",
  columnField: "jobTitle",
  valueField: "amount",
});

export default function CompatibilityLabPage() {
  return (
    <main style={{ display: "grid", gap: 24, paddingBottom: 48 }}>
      <section className="hero-panel hero-panel--blue" data-testid="compatibility-hero">
        <div className="hero-eyebrow">
          <span className="hero-tag">Compatibility</span>
          <span className="hero-tag">IBSheet8 기준</span>
          <span className="hero-tag">2026-03-16 갱신</span>
        </div>
        <h2 className="hero-title">IBSheet8 호환성 매트릭스</h2>
        <p className="hero-copy">
          이 화면은 단순 체크리스트가 아니라 IBSheet8 운영 UX를 기준으로 현재 VibeGrid가
          어디까지 올라왔는지, 무엇이 부분 구현 상태인지, 다음 제품 backlog가 무엇인지
          비교하는 곳입니다.
        </p>
      </section>

      <section className="stat-grid" data-testid="compatibility-summary">
        <SummaryCard label="구현 완료" value={`${doneCount}개`} state="done" />
        <SummaryCard label="부분 구현" value={`${partialCount}개`} state="partial" />
        <SummaryCard label="다음 단계" value={`${nextCount}개`} state="next" />
      </section>

      <section className="highlight-grid" data-testid="compatibility-scenarios">
        {scenarioLinks.map((link) => (
          <article key={link.href} className="lab-card">
            <div className="lab-card__head">
              <h3 className="lab-card__title">{link.title}</h3>
              <span className="status-pill" data-state="done">
                연결됨
              </span>
            </div>
            <p className="lab-card__copy">{link.description}</p>
            <Link href={link.href} className="action-link">
              화면 열기
            </Link>
          </article>
        ))}
      </section>

      <section className="section-panel" data-testid="compatibility-sources">
        <h3 className="section-panel__title">비교 기준으로 사용한 IBSheet8 문서</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {ibsheetSources.map((source) => (
            <div
              key={source.doc}
              style={{
                display: "grid",
                gap: 4,
                border: "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: 18,
                background: "rgba(255, 255, 255, 0.78)",
                padding: 16,
              }}
            >
              <strong style={{ fontSize: 14 }}>{source.doc}</strong>
              <span style={{ color: "#5b6b7f", lineHeight: 1.7 }}>{source.focus}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="highlight-grid" data-testid="compatibility-experimental-previews">
        <article className="lab-card" data-testid="compatibility-group-demo">
          <div className="lab-card__head">
            <h3 className="lab-card__title">Group Preview</h3>
            <span className="status-pill" data-state="partial">
              Experimental
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {groupedPreview.map((group) => (
              <div key={group.key}>
                <strong>{group.label}</strong> / {group.count}명
              </div>
            ))}
          </div>
        </article>

        <article className="lab-card" data-testid="compatibility-tree-demo">
          <div className="lab-card__head">
            <h3 className="lab-card__title">Tree Preview</h3>
            <span className="status-pill" data-state="partial">
              Experimental
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {treePreview.map((node) => (
              <div
                key={node.id}
                style={{
                  paddingLeft: `${node.level * 18}px`,
                  color: "#334155",
                }}
              >
                {node.hasChildren ? "▾ " : "• "}
                {node.label} / {node.row.headcount}명
              </div>
            ))}
          </div>
        </article>

        <article className="lab-card" data-testid="compatibility-pivot-demo">
          <div className="lab-card__head">
            <h3 className="lab-card__title">Pivot Preview</h3>
            <span className="status-pill" data-state="partial">
              Experimental
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {pivotPreview.rowKeys.map((rowKey) => (
              <div key={rowKey}>
                <strong>{rowKey}</strong>
                {pivotPreview.columnKeys.map((columnKey) => {
                  const cell = pivotPreview.cells.find(
                    (item) => item.rowKey === rowKey && item.columnKey === columnKey,
                  );

                  return (
                    <span key={`${rowKey}-${columnKey}`} style={{ marginLeft: 12 }}>
                      {columnKey}: {cell?.value ?? 0}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </article>
      </section>

      <CompatibilityTreeRuntimeDemo />

      <section className="matrix" data-testid="compatibility-matrix">
        <div className="matrix__row matrix__row--head">
          <div className="matrix__cell">기능</div>
          <div className="matrix__cell">IBSheet8 기준</div>
          <div className="matrix__cell">VibeGrid 현재</div>
          <div className="matrix__cell">상태</div>
          <div className="matrix__cell">다음 단계</div>
          <div className="matrix__cell">기준 문서</div>
        </div>

        {matrix.map((row) => (
          <div key={row.feature} className="matrix__row">
            <div className="matrix__cell matrix__cell--strong">{row.feature}</div>
            <div className="matrix__cell">{row.ibsheet}</div>
            <div className="matrix__cell">{row.vibeGrid}</div>
            <div className="matrix__cell">
              <span className="status-pill" data-state={row.status}>
                {statusLabel[row.status]}
              </span>
            </div>
            <div className="matrix__cell">{row.nextStep}</div>
            <div className="matrix__cell">{row.source}</div>
          </div>
        ))}
      </section>
    </main>
  );
}

function SummaryCard(props: {
  label: string;
  value: string;
  state: CompatStatus;
}) {
  return (
    <article className="stat-card">
      <div className="stat-card__label">{props.label}</div>
      <strong className="stat-card__value">{props.value}</strong>
      <div style={{ marginTop: 14 }}>
        <span className="status-pill" data-state={props.state}>
          {statusLabel[props.state]}
        </span>
      </div>
    </article>
  );
}
