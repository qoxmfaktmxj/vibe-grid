import Link from "next/link";
import type { Route } from "next";

const recommendedScreens = [
  {
    href: "/labs/grid" as Route,
    title: "1. Grid Lab",
    description:
      "행 선택, 복사, 삭제 토글, inline edit, side-form edit, clipboard paste, xlsx import/export까지 핵심 업무 동선을 검증하는 메인 화면입니다.",
    status: "구현됨",
  },
  {
    href: "/labs/bench" as Route,
    title: "2. Performance Bench",
    description:
      "10k / 50k / 100k 데이터 기준 가상 스크롤, sticky header, sticky 첫 컬럼의 체감을 확인하는 성능 화면입니다.",
    status: "구현됨",
  },
  {
    href: "/labs/compatibility" as Route,
    title: "3. Compatibility Lab",
    description:
      "IBSheet 운영 UX와 현재 VibeGrid를 비교하는 기준 화면입니다. 지금은 체크리스트 중심이고 실전화는 다음 슬라이스에서 진행합니다.",
    status: "후순위",
  },
  {
    href: "/labs/grid" as Route,
    title: "4. Scenario Regression",
    description:
      "별도 앱으로 빼기보다 Grid Lab 안에서 회귀 시나리오를 늘리는 방식으로 통합했습니다. 조회, 입력, 저장, 엑셀, 붙여넣기 시나리오를 계속 확장하면 됩니다.",
    status: "Grid Lab 통합",
  },
] as const;

export default function HubPage() {
  return (
    <main style={{ display: "grid", gap: 24, paddingBottom: 48 }}>
      <section
        style={{
          border: "1px solid #d9e4f1",
          borderRadius: 28,
          padding: 28,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,118,110,0.94))",
          color: "#fff",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.14)",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={chipStyle("rgba(255,255,255,0.12)", "#fff")}>Hub</span>
          <span style={chipStyle("rgba(16,185,129,0.18)", "#fff")}>
            권장 테스트 화면 4개
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: 40, lineHeight: 1.12 }}>
          그리드 테스트는 4화면 구성이면 충분합니다
        </h2>
        <p
          style={{
            marginTop: 16,
            maxWidth: 920,
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.82)",
          }}
        >
          현재는 `핵심 업무 화면 1개`, `대량 데이터 성능 화면 1개`, `IBSheet 비교
          기준 화면 1개`, `회귀 시나리오 확장 영역 1개` 구성이면 충분합니다.
          실제 운영은 1번과 2번을 바로 돌리고, 3번은 후순위로 두되 4번은 Grid Lab
          안에서 계속 키워가는 방식이 가장 현실적입니다.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        {recommendedScreens.map((screen) => (
          <article
            key={screen.title}
            style={{
              border: "1px solid #d9e4f1",
              borderRadius: 24,
              padding: 22,
              background: "#fff",
              boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong style={{ fontSize: 20 }}>{screen.title}</strong>
              <span
                style={{
                  borderRadius: 999,
                  padding: "6px 10px",
                  background:
                    screen.status === "구현됨"
                      ? "#dcfce7"
                      : screen.status === "후순위"
                        ? "#fef3c7"
                        : "#e2e8f0",
                  color:
                    screen.status === "구현됨"
                      ? "#047857"
                      : screen.status === "후순위"
                        ? "#92400e"
                        : "#334155",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {screen.status}
              </span>
            </div>
            <p style={{ marginTop: 14, color: "#475569", lineHeight: 1.75 }}>
              {screen.description}
            </p>
            <Link
              href={screen.href}
              style={{
                display: "inline-flex",
                marginTop: 16,
                borderRadius: 14,
                padding: "10px 14px",
                border: "1px solid #0f766e",
                color: "#0f766e",
                fontWeight: 700,
              }}
            >
              화면 열기
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

function chipStyle(background: string, color: string) {
  return {
    padding: "6px 12px",
    borderRadius: 999,
    background,
    color,
    fontSize: 12,
  } as const;
}
