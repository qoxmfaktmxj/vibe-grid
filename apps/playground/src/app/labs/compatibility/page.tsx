const checklist = [
  "행 선택 기본 UX가 IBSheet 사용자 기대와 자연스럽게 맞는가",
  "복사 / 삭제 토글 / 저장 액션명이 legacy 감각을 유지하는가",
  "붙여넣기와 엑셀 업로드가 같은 검증 규칙을 타는가",
  "frozen / sticky / wide-table 시나리오가 레이어 충돌 없이 동작하는가",
  "validation 오류와 save bundle이 동시에 보일 때도 해석이 쉬운가",
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
        <h2 style={{ margin: 0, fontSize: 38 }}>Compatibility Lab</h2>
        <p
          style={{
            marginTop: 16,
            maxWidth: 860,
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.82)",
          }}
        >
          이 화면은 IBSheet 운영 UX와 현재 VibeGrid 동작을 비교하는 기준 레이어입니다.
          지금은 실전화 전 단계라서 체크리스트와 acceptance 기준을 먼저 고정하는 용도로
          유지하고 있고, 실질적인 비교 시나리오는 다음 슬라이스에서 보강할 예정입니다.
        </p>
      </section>

      <section
        style={{
          border: "1px solid #d9e4f1",
          borderRadius: 24,
          padding: 24,
          background: "#fff",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 24 }}>현재 체크리스트</h3>
        <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
          {checklist.map((item, index) => (
            <div
              key={item}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                borderRadius: 18,
                background: "#f8fafc",
                padding: 16,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "#0f766e",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                }}
              >
                {index + 1}
              </div>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{item}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
