import Link from "next/link";
import type { Route } from "next";

type CompatStatus = "done" | "partial" | "next";

const ibsheetSources = [
  {
    doc: "basic-course.html",
    focus: "조회, 페이징 조회, 저장, 저장 JSON 구조",
  },
  {
    doc: "header.html",
    focus: "헤더, 헤더 체크, 컬럼 제어",
  },
  {
    doc: "init-structure.html",
    focus: "필터, 그룹, 좌측 고정 컬럼",
  },
  {
    doc: "on-before-paste.html / on-after-paste.html",
    focus: "붙여넣기 전후 이벤트와 lifecycle",
  },
  {
    doc: "on-after-save.html",
    focus: "저장 완료 후 이벤트",
  },
  {
    doc: "on-after-row-copy.html",
    focus: "행 복사 후 이벤트",
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
    description: "실제 업무형 편집, 삭제 체크, 붙여넣기, 저장 번들을 직접 확인합니다.",
  },
  {
    href: "/labs/bench",
    title: "Bench",
    description: "10k, 50k, 100k 기준 실제 VibeGrid 경로의 성능과 상호작용을 검증합니다.",
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
    ibsheet: "행 중심 UX 위에 범위 선택과 클립보드 작업을 제공",
    vibeGrid: "행 선택, 범위 선택, 범위 복사/붙여넣기, overflow 정책까지 동작",
    status: "done",
    nextStep: "drag polish와 이벤트 surface만 추가 검토",
    source: "basic-course / on-before-paste / on-after-paste",
  },
  {
    feature: "저장 번들 / 변경 상태 분리",
    ibsheet: "추가, 수정, 삭제 상태를 분리한 저장 구조 제공",
    vibeGrid: "inserted / updated / deleted diff bundle과 row state를 제공",
    status: "done",
    nextStep: "host callback naming만 더 정리",
    source: "basic-course / on-after-save",
  },
  {
    feature: "헤더 메뉴 / 정렬 / 숨김 / 고정 / 폭 초기화",
    ibsheet: "헤더 중심 컬럼 제어",
    vibeGrid: "헤더 메뉴에서 정렬, 숨김, 좌우 고정, 폭 초기화 지원",
    status: "done",
    nextStep: "HeaderCheck 계열 확장 검토",
    source: "header",
  },
  {
    feature: "in-grid filter row / 조회 경로",
    ibsheet: "헤더 아래 필터 입력과 조회 흐름 제공",
    vibeGrid: "필터 행, text/select/number filter, query path 연동 지원",
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
    ibsheet: "업무 기능이 결합된 상태의 체감 성능 확보",
    vibeGrid: "actual render path row virtualization + bench 상호작용 지표 제공",
    status: "done",
    nextStep: "latency band 기준값을 팀 규칙으로 고정",
    source: "init-structure",
  },
  {
    feature: "날짜 editor + host date policy",
    ibsheet: "업무 정책을 반영한 날짜 편집 가능",
    vibeGrid: "날짜 editor foundation과 host holiday/date policy helper 제공",
    status: "partial",
    nextStep: "host 앱 예제와 disabled reason UX 보강",
    source: "basic-course",
  },
  {
    feature: "행 복사 lifecycle parity",
    ibsheet: "행 복사 이후 public lifecycle 제공",
    vibeGrid: "행 복사 동작은 있으나 public row-copy lifecycle hook은 아직 미정",
    status: "partial",
    nextStep: "public contract 여부 결정",
    source: "on-after-row-copy",
  },
  {
    feature: "붙여넣기 lifecycle parity",
    ibsheet: "onBeforePaste / onAfterPaste 이벤트 제공",
    vibeGrid: "summary, validation, skip reason은 있으나 public hook surface는 아직 없음",
    status: "partial",
    nextStep: "clipboard hook contract 설계",
    source: "on-before-paste / on-after-paste",
  },
  {
    feature: "저장 lifecycle parity",
    ibsheet: "onAfterSave 등 저장 후 이벤트 제공",
    vibeGrid: "save bundle은 있으나 public after-save hook은 아직 없음",
    status: "partial",
    nextStep: "host save callback contract 구체화",
    source: "on-after-save",
  },
  {
    feature: "HeaderCheck 전체 체크",
    ibsheet: "헤더 체크로 전체 행 선택/해제",
    vibeGrid: "미구현",
    status: "next",
    nextStep: "삭제 체크와 일반 선택 체크를 분리한 설계 필요",
    source: "header",
  },
  {
    feature: "Group / Tree / Pivot 계열",
    ibsheet: "그룹, 트리, 피벗형 시각화 지원",
    vibeGrid: "미구현",
    status: "next",
    nextStep: "실제 제품 backlog에서 필요성 재판단",
    source: "init-structure",
  },
  {
    feature: "IBSheet public event parity",
    ibsheet: "paste/save/copy 관련 이벤트 계약 제공",
    vibeGrid: "브라우저 검증은 있으나 동일한 public event surface는 아직 없음",
    status: "next",
    nextStep: "stable API로 열지 experimental로 둘지 결정",
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

export default function CompatibilityLabPage() {
  return (
    <main style={{ display: "grid", gap: 24, paddingBottom: 48 }}>
      <section className="hero-panel hero-panel--blue" data-testid="compatibility-hero">
        <div className="hero-eyebrow">
          <span className="hero-tag">Compatibility</span>
          <span className="hero-tag">IBSheet8 기준</span>
          <span className="hero-tag">2026-03-16 점검</span>
        </div>
        <h2 className="hero-title">IBSheet8 호환성 매트릭스</h2>
        <p className="hero-copy">
          이 화면은 단순 체크리스트가 아니라 IBSheet8 운영 UX를 기준으로 현재 VibeGrid가
          어디까지 구현되었는지, 무엇이 부분 구현 상태인지, 다음 제품 backlog가 무엇인지
          정리한 비교판입니다.
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
