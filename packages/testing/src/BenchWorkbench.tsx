"use client";

import { startTransition, useDeferredValue, useMemo, useRef, useState } from "react";
import { createBenchmarkRows, createBenchmarkSnapshot } from "@vibe-grid/core";
import {
  defaultVirtualizationPreset,
  useVirtualRows,
} from "@vibe-grid/virtualization";

const SCENARIOS = [10_000, 50_000, 100_000] as const;

export function BenchWorkbench() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [rowCount, setRowCount] = useState<number>(100_000);
  const deferredRowCount = useDeferredValue(rowCount);
  const rows = useMemo(() => createBenchmarkRows(deferredRowCount), [deferredRowCount]);
  const snapshot = useMemo(
    () => createBenchmarkSnapshot(deferredRowCount),
    [deferredRowCount],
  );

  const rowVirtualizer = useVirtualRows({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    rowHeight: 48,
    overscan: 12,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const visibleRange =
    virtualRows.length > 0
      ? `${virtualRows[0].index + 1} - ${virtualRows[virtualRows.length - 1].index + 1}`
      : "-";

  return (
    <section style={{ display: "grid", gap: 24 }}>
      <section
        style={{
          border: "1px solid rgba(148, 163, 184, 0.18)",
          borderRadius: 28,
          padding: 32,
          background: "rgba(15, 23, 42, 0.72)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 60px rgba(2, 6, 23, 0.35)",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={tagStyle("#0f172a", "#fff")}>Bench</span>
          <span style={tagStyle("rgba(16,185,129,0.15)", "#bbf7d0")}>
            Virtualized rows
          </span>
          <span style={tagStyle("rgba(56,189,248,0.15)", "#bae6fd")}>
            {deferredRowCount.toLocaleString("ko-KR")} rows
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: 40 }}>VibeGrid virtualization bench</h1>
        <p style={{ marginTop: 16, color: "#cbd5e1", lineHeight: 1.8, maxWidth: 920 }}>
          실제 업무형 그리드를 붙이기 전에, 대량 데이터 가상 스크롤 기준선을 먼저
          검증하는 화면입니다. row virtualization, sticky header, visible range를
          한 번에 볼 수 있습니다.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario}
              type="button"
              onClick={() =>
                startTransition(() => {
                  setRowCount(scenario);
                })
              }
              style={{
                border: "1px solid rgba(148,163,184,0.28)",
                borderRadius: 14,
                background:
                  scenario === rowCount ? "rgba(56,189,248,0.18)" : "rgba(15,23,42,0.6)",
                color: scenario === rowCount ? "#e0f2fe" : "#e2e8f0",
                padding: "12px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {scenario.toLocaleString("ko-KR")} rows
            </button>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <StatCard label="Target rows" value={snapshot.totalRows.toLocaleString("ko-KR")} />
        <StatCard label="Visible range" value={visibleRange} />
        <StatCard label="Rendered rows" value={String(virtualRows.length)} />
        <StatCard label="Overscan" value={String(defaultVirtualizationPreset.overscan)} />
      </section>

      <section
        style={{
          border: "1px solid rgba(148,163,184,0.18)",
          borderRadius: 24,
          overflow: "hidden",
          background: "rgba(15, 23, 42, 0.72)",
          boxShadow: "0 20px 60px rgba(2, 6, 23, 0.28)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 170px 1.2fr 1fr 0.8fr 120px 120px",
            borderBottom: "1px solid rgba(148,163,184,0.16)",
            background: "rgba(17,24,39,0.94)",
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          {["No", "사번", "이름", "부서", "직급", "사용", "정렬"].map((header, index) => (
            <div
              key={header}
              style={{
                padding: "16px 18px",
                fontWeight: 800,
                color: "#e2e8f0",
                position: index === 0 ? "sticky" : "relative",
                left: index === 0 ? 0 : undefined,
                background: index === 0 ? "rgba(17,24,39,0.98)" : undefined,
                zIndex: index === 0 ? 3 : 2,
              }}
            >
              {header}
            </div>
          ))}
        </div>

        <div ref={scrollRef} style={{ height: 640, overflow: "auto", position: "relative" }}>
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              const odd = virtualRow.index % 2 === 1;

              return (
                <div
                  key={row.rowKey}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: "grid",
                    gridTemplateColumns: "140px 170px 1.2fr 1fr 0.8fr 120px 120px",
                    borderBottom: "1px solid rgba(148,163,184,0.12)",
                    background: odd ? "rgba(30,41,59,0.42)" : "rgba(15,23,42,0.28)",
                    color: "#e2e8f0",
                  }}
                >
                  <BenchCell sticky>{virtualRow.index + 1}</BenchCell>
                  <BenchCell>{row.employeeNo}</BenchCell>
                  <BenchCell>{row.employeeName}</BenchCell>
                  <BenchCell>{row.department}</BenchCell>
                  <BenchCell>{row.jobTitle}</BenchCell>
                  <BenchCell>{row.useYn === "Y" ? "사용" : "미사용"}</BenchCell>
                  <BenchCell>{row.sortOrder}</BenchCell>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "1.2fr 1fr",
        }}
      >
        <article style={panelStyle}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Benchmark sample rows</h2>
          <pre style={codeBlockStyle}>{JSON.stringify(snapshot.firstRows, null, 2)}</pre>
        </article>

        <article style={panelStyle}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Bench notes</h2>
          <div style={{ marginTop: 16, color: "#cbd5e1", lineHeight: 1.8 }}>
            <div>현재는 row virtualization만 활성화했습니다.</div>
            <div>다음 단계에서 pinned column과 sticky shadow를 올릴 예정입니다.</div>
            <div>100,000 rows 시나리오를 바로 전환해서 스크롤 감각을 확인할 수 있습니다.</div>
          </div>
        </article>
      </section>
    </section>
  );
}

function StatCard(props: { label: string; value: string }) {
  return (
    <article
      style={{
        border: "1px solid rgba(148,163,184,0.18)",
        borderRadius: 20,
        padding: 20,
        background: "rgba(17,24,39,0.88)",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 13 }}>{props.label}</div>
      <strong style={{ display: "block", marginTop: 8, fontSize: 28 }}>{props.value}</strong>
    </article>
  );
}

function BenchCell(props: { children: React.ReactNode; sticky?: boolean }) {
  return (
    <div
      style={{
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        position: props.sticky ? "sticky" : "relative",
        left: props.sticky ? 0 : undefined,
        background: props.sticky ? "rgba(17,24,39,0.98)" : undefined,
        zIndex: props.sticky ? 1 : undefined,
      }}
    >
      {props.children}
    </div>
  );
}

function tagStyle(background: string, color: string) {
  return {
    padding: "6px 12px",
    borderRadius: 999,
    background,
    color,
    fontSize: 12,
  } as const;
}

const panelStyle = {
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 24,
  padding: 20,
  background: "rgba(17,24,39,0.88)",
} as const;

const codeBlockStyle = {
  margin: 0,
  marginTop: 16,
  whiteSpace: "pre-wrap",
  color: "#e2e8f0",
  lineHeight: 1.7,
} as const;
