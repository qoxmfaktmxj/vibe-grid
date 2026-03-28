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
      "행 선택, 복사, 삭제 토글, inline edit, side-form edit, clipboard paste, xlsx import/export까지 업무형 Grid 흐름을 한곳에서 검증합니다.",
    status: "done",
    statusLabel: "구현 완료",
  },
  {
    href: "/labs/bench",
    title: "2. Performance Bench",
    description:
      "10k, 50k, 100k 데이터 기준 가상 스크롤과 sticky header, pinned column 체감 성능을 빠르게 확인할 수 있습니다.",
    status: "done",
    statusLabel: "구현 완료",
  },
  {
    href: "/labs/employee-batch",
    title: "3. Employee Batch Lab",
    description:
      "15,000건 직원 목록에서 10,000명 선택 스냅샷, sync/async 서버 작업 실행, delete/update/insert 계획을 한 화면에서 검증합니다.",
    status: "done",
    statusLabel: "신규 검증면",
  },
  {
    href: "/labs/compatibility",
    title: "4. Compatibility Lab",
    description:
      "IBSheet 운영 UX와 현재 VibeGrid 상태를 비교하고 다음 개선 우선순위를 정리하는 비교 면입니다.",
    status: "pending",
    statusLabel: "계획 단계",
  },
  {
    href: "/labs/grid",
    title: "5. Scenario Regression",
    description:
      "별도 앱보다 Grid Lab 안에 시나리오를 계속 축적하는 방향이 더 효율적이라, 회귀 시나리오는 Grid Lab에 통합해 운영합니다.",
    status: "merged",
    statusLabel: "Grid Lab 통합",
  },
] as const;

export default function HubPage() {
  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 20, padding: "24px 0 48px" }}>
      <section className="hero-panel hero-panel--teal" style={{ margin: "0 48px" }}>
        <div className="hero-eyebrow">
          <span className="hero-tag">Hub</span>
          <span className="hero-tag">권장 테스트 화면 5개</span>
        </div>
        <h2 className="hero-title">VibeGrid 테스트 허브</h2>
        <p className="hero-copy">
          Grid Lab에서 Grid 기능을 테스트하며 점점 완성된 Grid로 개발시키는 것을
          목표로 합니다.
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
    </main>
  );
}
