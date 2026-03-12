import Link from "next/link";
import type { Route } from "next";

type ScreenStatus = "done" | "pending" | "merged";

const recommendedScreens: Array<{
  href: Route;
  title: string;
  description: string;
  status: ScreenStatus;
  statusLabel: string;
}> = [
  {
    href: "/labs/grid",
    title: "1. Grid Lab",
    description:
      "행 선택, 복사, 삭제 토글, inline edit, side-form edit, clipboard paste, xlsx import/export까지 핵심 업무 플로우를 한 곳에서 검증합니다.",
    status: "done",
    statusLabel: "구현됨",
  },
  {
    href: "/labs/bench",
    title: "2. Performance Bench",
    description:
      "10k, 50k, 100k 데이터 기준 가상 스크롤과 sticky header, sticky 첫 컬럼의 체감 성능을 빠르게 확인할 수 있습니다.",
    status: "done",
    statusLabel: "구현됨",
  },
  {
    href: "/labs/compatibility",
    title: "3. Compatibility Lab",
    description:
      "IBSheet 운영 UX와 현재 VibeGrid의 상태를 비교해 다음 우선순위를 정리하는 비교 랩입니다.",
    status: "pending",
    statusLabel: "후순위",
  },
  {
    href: "/labs/grid",
    title: "4. Scenario Regression",
    description:
      "별도 앱보다 Grid Lab 안에 시나리오를 계속 축적하는 방향이 더 효율적이라, 회귀 시나리오는 Grid Lab에 통합해 운영합니다.",
    status: "merged",
    statusLabel: "Grid Lab 통합",
  },
] as const;

const operatingPrinciples = [
  "업무형 UX는 행 선택 중심으로 유지합니다.",
  "대용량 성능은 Bench에서 먼저 검증하고 기능을 확장합니다.",
  "IBSheet 비교는 문서가 아니라 호환성 기준으로 관리합니다.",
];

export default function HubPage() {
  return (
    <main style={{ display: "grid", gap: 24, paddingBottom: 48 }}>
      <section className="hero-panel hero-panel--teal">
        <div className="hero-eyebrow">
          <span className="hero-tag">Hub</span>
          <span className="hero-tag">권장 테스트 화면 4개</span>
        </div>
        <h2 className="hero-title">그리드 테스트는 4화면 구성이면 충분합니다</h2>
        <p className="hero-copy">
          지금 단계에서는 핵심 업무 화면 1개, 대량 데이터 성능 화면 1개, IBSheet 비교
          화면 1개, 회귀 시나리오 확장 영역 1개면 충분합니다. 실전 운영은 1번과 2번을
          먼저 탄탄하게 만들고, 3번은 우선순위형 비교판으로 두며, 4번은 Grid Lab에
          시나리오를 계속 쌓아가는 방식이 가장 현실적입니다.
        </p>
      </section>

      <section className="highlight-grid">
        {recommendedScreens.map((screen) => (
          <article key={screen.title} className="lab-card">
            <div className="lab-card__head">
              <h3 className="lab-card__title">{screen.title}</h3>
              <span className="status-pill" data-state={screen.status}>
                {screen.statusLabel}
              </span>
            </div>
            <p className="lab-card__copy">{screen.description}</p>
            <Link href={screen.href} className="action-link">
              화면 열기
            </Link>
          </article>
        ))}
      </section>

      <section
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
        }}
      >
        <article className="section-panel">
          <h3 className="section-panel__title">지금 운영 방식</h3>
          <p className="section-panel__copy">
            Grid Lab은 기능 회귀와 업무 흐름 검증의 중심이고, Bench는 엔진 체력 테스트,
            Compatibility는 우선순위 정리용 비교판입니다. 이 세 축이 잡히면 새로운
            편집기나 고급 기능을 추가해도 방향을 잃지 않습니다.
          </p>
        </article>

        <article className="section-panel">
          <h3 className="section-panel__title">핵심 원칙</h3>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {operatingPrinciples.map((principle) => (
              <div
                key={principle}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "start",
                  color: "#506176",
                  lineHeight: 1.7,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(15, 118, 110, 0.12)",
                    color: "#0f766e",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span>{principle}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
