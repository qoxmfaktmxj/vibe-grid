import Link from "next/link";
import type { Route } from "next";

type CompatStatus = "done" | "partial" | "next";

const matrix = [
  {
    feature: "행 선택 중심 UX",
    ibsheet: "행 중심 선택, 상단 액션 기반",
    vibeGrid: "행 선택과 active cell을 함께 관리",
    status: "done",
    phase: "현재",
    note: "Grid Lab에서 바로 검증 가능",
  },
  {
    feature: "저장 번들 분리",
    ibsheet: "추가/수정/삭제 상태 분리",
    vibeGrid: "inserted / updated / deleted diff bundle 지원",
    status: "done",
    phase: "현재",
    note: "저장 번들 미리보기로 확인 가능",
  },
  {
    feature: "엑셀 업로드/다운로드",
    ibsheet: "양식, 업로드, 다운로드",
    vibeGrid: "xlsx 템플릿, export, import preview 지원",
    status: "done",
    phase: "현재",
    note: "헤더 검증 포함",
  },
  {
    feature: "컬럼 기능 4종",
    ibsheet: "숨김, 순서, 폭, 고정",
    vibeGrid: "visibility, ordering, sizing, pinning 지원",
    status: "done",
    phase: "현재",
    note: "Grid Lab 우측 패널에서 직접 조정 가능",
  },
  {
    feature: "편집기 세트",
    ibsheet: "text/select/number/textarea 계열 편집기",
    vibeGrid: "side editor와 inline editor 모두 메타 기반으로 동작",
    status: "partial",
    phase: "현재 + 다음",
    note: "코드도움형/날짜형 편집기는 다음 슬라이스",
  },
  {
    feature: "헤더 메뉴 / 필터 행",
    ibsheet: "운영 사용성이 높은 대표 기능",
    vibeGrid: "아직 미구현",
    status: "next",
    phase: "다음",
    note: "Compatibility Lab 후속 우선순위",
  },
  {
    feature: "자동 회귀 테스트",
    ibsheet: "별도 제공 없음, 운영팀 수동 검증 의존",
    vibeGrid: "Playwright 시나리오로 자동화 시작",
    status: "partial",
    phase: "현재 + 다음",
    note: "Grid Lab 핵심 흐름부터 커버",
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
    description: "업무형 CRUD, 저장, 붙여넣기, 엑셀, 컬럼 기능 검증",
  },
  {
    href: "/labs/bench",
    title: "Bench",
    description: "10k / 50k / 100k 데이터의 가상 스크롤 성능 검증",
  },
];

export default function CompatibilityLabPage() {
  return (
    <main style={{ display: "grid", gap: 24, paddingBottom: 48 }}>
      <section
        style={{
          border: "1px solid #d9e4f1",
          borderRadius: 28,
          padding: 28,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(2,132,199,0.92))",
          color: "#fff",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.14)",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={chipStyle("rgba(255,255,255,0.12)", "#fff")}>Compatibility</span>
          <span style={chipStyle("rgba(125,211,252,0.18)", "#fff")}>IBSheet Gap Review</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 38 }}>IBSheet 비교 매트릭스</h2>
        <p
          style={{
            marginTop: 16,
            maxWidth: 920,
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.82)",
          }}
        >
          이 화면은 단순 체크리스트가 아니라, IBSheet 운영 UX와 현재 VibeGrid 제품
          상태를 기능별로 나눠 보는 기준판입니다. 지금 당장 되는 것, 일부만 되는 것,
          다음 슬라이스로 넘길 것을 구분해서 보시면 됩니다.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        {scenarioLinks.map((link) => (
          <article
            key={link.href}
            style={{
              border: "1px solid #d9e4f1",
              borderRadius: 22,
              padding: 20,
              background: "#fff",
              boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)",
            }}
          >
            <strong style={{ fontSize: 20, color: "#0f172a" }}>{link.title}</strong>
            <p style={{ marginTop: 12, color: "#475569", lineHeight: 1.7 }}>
              {link.description}
            </p>
            <Link
              href={link.href}
              style={{
                display: "inline-flex",
                marginTop: 14,
                borderRadius: 12,
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

      <section
        style={{
          border: "1px solid #d9e4f1",
          borderRadius: 24,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr 120px 120px 1.1fr",
            gap: 0,
            borderBottom: "1px solid #d9e4f1",
            background: "#f8fafc",
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          <HeaderCell>기능</HeaderCell>
          <HeaderCell>IBSheet 기준</HeaderCell>
          <HeaderCell>VibeGrid 현재</HeaderCell>
          <HeaderCell>상태</HeaderCell>
          <HeaderCell>단계</HeaderCell>
          <HeaderCell>메모</HeaderCell>
        </div>

        {matrix.map((row) => (
          <div
            key={row.feature}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr 120px 120px 1.1fr",
              gap: 0,
              borderBottom: "1px solid #eef2f7",
            }}
          >
            <BodyCell strong>{row.feature}</BodyCell>
            <BodyCell>{row.ibsheet}</BodyCell>
            <BodyCell>{row.vibeGrid}</BodyCell>
            <BodyCell>
              <StatusBadge status={row.status} />
            </BodyCell>
            <BodyCell>{row.phase}</BodyCell>
            <BodyCell>{row.note}</BodyCell>
          </div>
        ))}
      </section>
    </main>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "16px 18px" }}>{children}</div>;
}

function BodyCell(input: { children: React.ReactNode; strong?: boolean }) {
  return (
    <div
      style={{
        padding: "16px 18px",
        color: "#334155",
        lineHeight: 1.7,
        fontWeight: input.strong ? 700 : 500,
      }}
    >
      {input.children}
    </div>
  );
}

function StatusBadge({ status }: { status: CompatStatus }) {
  const palette =
    status === "done"
      ? { label: "구현됨", background: "#dcfce7", color: "#047857" }
      : status === "partial"
        ? { label: "부분 구현", background: "#fff7ed", color: "#c2410c" }
        : { label: "다음", background: "#e2e8f0", color: "#334155" };

  return (
    <span
      style={{
        display: "inline-flex",
        borderRadius: 999,
        padding: "6px 10px",
        background: palette.background,
        color: palette.color,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {palette.label}
    </span>
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
