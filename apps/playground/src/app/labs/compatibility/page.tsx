import Link from "next/link";
import type { Route } from "next";

type CompatStatus = "done" | "partial" | "next";

const matrix = [
  {
    feature: "행 선택 중심 UX",
    ibsheet: "행 중심 선택과 상단 액션 흐름",
    vibeGrid: "행 선택과 active cell을 분리해 함께 관리",
    status: "done",
    phase: "현재",
    note: "Grid Lab에서 바로 검증 가능",
  },
  {
    feature: "저장 번들 분리",
    ibsheet: "추가, 수정, 삭제 상태 분리 저장",
    vibeGrid: "inserted / updated / deleted diff bundle 제공",
    status: "done",
    phase: "현재",
    note: "저장 번들 미리보기로 즉시 확인 가능",
  },
  {
    feature: "엑셀 업로드/다운로드",
    ibsheet: "양식, 업로드, 다운로드 제공",
    vibeGrid: "xlsx 템플릿, export, import preview 지원",
    status: "done",
    phase: "현재",
    note: "헤더 검증 포함",
  },
  {
    feature: "컬럼 기능 4종",
    ibsheet: "보이기, 순서, 폭, 좌우 고정",
    vibeGrid: "visibility, ordering, sizing, pinning 지원",
    status: "done",
    phase: "현재",
    note: "Grid Lab 우측 패널에서 직접 확인 가능",
  },
  {
    feature: "편집기 세트",
    ibsheet: "text, select, number, textarea 계열 편집기",
    vibeGrid: "side editor와 inline editor를 메타 기반으로 제공",
    status: "partial",
    phase: "현재 + 다음",
    note: "날짜, 코드도움형 편집기는 다음 슬라이스",
  },
  {
    feature: "헤더 메뉴 / 필터 행",
    ibsheet: "운영 사용성이 높은 핵심 기능",
    vibeGrid: "아직 미구현",
    status: "next",
    phase: "다음",
    note: "Compatibility Lab의 최우선 후속 과제",
  },
  {
    feature: "자동 회귀 테스트",
    ibsheet: "별도 제공은 없지만 운영상 필수",
    vibeGrid: "Playwright 기반 시나리오 자동화 시작",
    status: "partial",
    phase: "현재 + 다음",
    note: "Grid Lab 핵심 플로우 중심으로 커버 중",
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
    description: "업무형 CRUD, 저장 번들, 엑셀, 붙여넣기, 컬럼 기능을 한 번에 확인합니다.",
  },
  {
    href: "/labs/bench",
    title: "Bench",
    description: "10k, 50k, 100k 기준 가상 스크롤과 sticky 동작을 성능 관점에서 확인합니다.",
  },
];

const statusLabel: Record<CompatStatus, string> = {
  done: "구현됨",
  partial: "부분 구현",
  next: "다음",
};

export default function CompatibilityLabPage() {
  return (
    <main style={{ display: "grid", gap: 24, paddingBottom: 48 }}>
      <section className="hero-panel hero-panel--blue">
        <div className="hero-eyebrow">
          <span className="hero-tag">Compatibility</span>
          <span className="hero-tag">IBSheet Gap Review</span>
        </div>
        <h2 className="hero-title">IBSheet 비교 매트릭스</h2>
        <p className="hero-copy">
          이 화면은 단순 체크리스트가 아니라, IBSheet 운영 UX와 현재 VibeGrid 제품
          상태를 기능별로 비교해 지금 당장 되는 것과 다음 슬라이스로 넘길 것을
          구분하는 비교판입니다.
        </p>
      </section>

      <section className="highlight-grid">
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

      <section className="matrix">
        <div className="matrix__row matrix__row--head">
          <div className="matrix__cell">기능</div>
          <div className="matrix__cell">IBSheet 기준</div>
          <div className="matrix__cell">VibeGrid 현재</div>
          <div className="matrix__cell">상태</div>
          <div className="matrix__cell">단계</div>
          <div className="matrix__cell">메모</div>
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
            <div className="matrix__cell">{row.phase}</div>
            <div className="matrix__cell">{row.note}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
