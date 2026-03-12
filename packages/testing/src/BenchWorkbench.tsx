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
          border: "1px solid #dbe7f3",
          borderRadius: 28,
          padding: 32,
          background:
            "linear-gradient(135deg, rgba(245,252,255,0.96), rgba(233,248,244,0.98))",
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={tagStyle("#0f766e", "#f0fdfa")}>Bench</span>
          <span style={tagStyle("#dff7eb", "#047857")}>Virtualized rows</span>
          <span style={tagStyle("#e0f2fe", "#0369a1")}>
            {deferredRowCount.toLocaleString("ko-KR")} rows
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: 40, color: "#0f172a" }}>
          VibeGrid 성능 벤치 랩
        </h1>
        <p
          style={{
            marginTop: 16,
            color: "#475569",
            lineHeight: 1.8,
            maxWidth: 920,
          }}
        >
          실제 업무형 그리드에 기능을 더 붙이기 전에, 대량 데이터 스크롤 기준선을 먼저
          확인하는 화면입니다. row virtualization, sticky header, visible range를 한 번에
          보면서 10만 건 수준의 렌더링 감각을 확인할 수 있습니다.
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
                border: "1px solid #bfdbfe",
                borderRadius: 14,
                background: scenario === rowCount ? "#0f766e" : "#ffffff",
                color: scenario === rowCount ? "#f8fafc" : "#0f172a",
                padding: "12px 16px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow:
                  scenario === rowCount
                    ? "0 10px 24px rgba(15, 118, 110, 0.22)"
                    : "0 6px 18px rgba(15, 23, 42, 0.06)",
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
        <StatCard label="대상 행 수" value={snapshot.totalRows.toLocaleString("ko-KR")} />
        <StatCard label="현재 표시 범위" value={visibleRange} />
        <StatCard label="실제 렌더 행 수" value={String(virtualRows.length)} />
        <StatCard label="Overscan" value={String(defaultVirtualizationPreset.overscan)} />
      </section>

      <section
        style={{
          border: "1px solid #dbe7f3",
          borderRadius: 24,
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 170px 1.2fr 1fr 0.8fr 120px 120px",
            borderBottom: "1px solid #dbe7f3",
            background: "#f8fbff",
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          {["No", "사번", "이름", "부서", "직급", "사용", "정렬"].map(
            (header, index) => (
              <div
                key={header}
                style={{
                  padding: "16px 18px",
                  fontWeight: 800,
                  color: "#0f172a",
                  position: index === 0 ? "sticky" : "relative",
                  left: index === 0 ? 0 : undefined,
                  background: index === 0 ? "#f3f8ff" : undefined,
                  zIndex: index === 0 ? 3 : 2,
                }}
              >
                {header}
              </div>
            ),
          )}
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
                    borderBottom: "1px solid #eef4fb",
                    background: odd ? "#fbfdff" : "#ffffff",
                    color: "#1e293b",
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
          <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>
            Benchmark sample rows
          </h2>
          <pre style={codeBlockStyle}>{JSON.stringify(snapshot.firstRows, null, 2)}</pre>
        </article>

        <article style={panelStyle}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>Bench notes</h2>
          <div style={{ marginTop: 16, color: "#475569", lineHeight: 1.8 }}>
            <div>현재는 row virtualization 중심으로 성능 기준선을 잡았습니다.</div>
            <div>다음 단계에서는 pinned column과 sticky shadow를 더 붙일 예정입니다.</div>
            <div>
              100,000 rows 시나리오를 바로 전환해서 스크롤 감각과 렌더 행 수를 확인할 수
              있습니다.
            </div>
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
        border: "1px solid #dbe7f3",
        borderRadius: 20,
        padding: 20,
        background: "#ffffff",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 13 }}>{props.label}</div>
      <strong
        style={{
          display: "block",
          marginTop: 8,
          fontSize: 28,
          color: "#0f172a",
        }}
      >
        {props.value}
      </strong>
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
        background: props.sticky ? "#f8fbff" : undefined,
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
  border: "1px solid #dbe7f3",
  borderRadius: 24,
  padding: 20,
  background: "#ffffff",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
} as const;

const codeBlockStyle = {
  margin: 0,
  marginTop: 16,
  whiteSpace: "pre-wrap",
  color: "#1e293b",
  lineHeight: 1.7,
} as const;
