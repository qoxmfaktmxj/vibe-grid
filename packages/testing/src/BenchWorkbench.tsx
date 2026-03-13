"use client";

import { startTransition, useDeferredValue, useMemo, useRef, useState } from "react";
import { createBenchmarkRows, createBenchmarkSnapshot } from "@vibe-grid/core";
import {
  defaultVirtualizationPreset,
  useVirtualRows,
} from "@vibe-grid/virtualization";
import { RealGridPerformanceLab } from "./RealGridPerformanceLab";

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
      <section className="hero-panel hero-panel--mint">
        <div className="hero-eyebrow">
          <span className="hero-tag hero-tag--light">Bench</span>
          <span className="hero-tag hero-tag--light">Virtualized rows</span>
          <span className="hero-tag hero-tag--light">
            {deferredRowCount.toLocaleString("ko-KR")} rows
          </span>
        </div>
        <h1 className="hero-title">VibeGrid 성능 벤치 랩</h1>
        <p className="hero-copy hero-copy--dark">
          실제 업무형 기능을 더 붙이기 전에 대량 데이터에서 스크롤과 sticky 동작이
          어디까지 버티는지 먼저 확인하는 공간입니다. 지금은 row virtualization에
          집중하고, 다음 슬라이스에서 pinned column과 shadow 레이어를 더 정교하게
          다듬습니다.
        </p>

        <div className="segmented-row" style={{ marginTop: 22 }}>
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario}
              type="button"
              onClick={() =>
                startTransition(() => {
                  setRowCount(scenario);
                })
              }
              className={
                scenario === rowCount
                  ? "segmented-button segmented-button--active"
                  : "segmented-button"
              }
            >
              {scenario.toLocaleString("ko-KR")} rows
            </button>
          ))}
        </div>
      </section>

      <section className="stat-grid">
        <StatCard label="총 데이터" value={snapshot.totalRows.toLocaleString("ko-KR")} />
        <StatCard label="현재 표시 범위" value={visibleRange} />
        <StatCard label="실제 렌더 수" value={String(virtualRows.length)} />
        <StatCard label="Overscan" value={String(defaultVirtualizationPreset.overscan)} />
      </section>

      <section
        className="section-panel"
        style={{ padding: 0, overflow: "hidden", borderRadius: 28 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 170px 1.2fr 1fr 0.8fr 120px 120px",
            borderBottom: "1px solid rgba(226, 232, 240, 0.86)",
            background: "linear-gradient(180deg, #f9fcff, #f1f7fb)",
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
                color: "#091526",
                position: index === 0 ? "sticky" : "relative",
                left: index === 0 ? 0 : undefined,
                background: index === 0 ? "#eef6fb" : undefined,
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
                    borderBottom: "1px solid rgba(237, 242, 247, 0.9)",
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
        <article className="section-panel">
          <h2 className="section-panel__title">Benchmark sample rows</h2>
          <pre className="code-block">{JSON.stringify(snapshot.firstRows, null, 2)}</pre>
        </article>

        <article className="section-panel">
          <h2 className="section-panel__title">Bench notes</h2>
          <div style={{ marginTop: 16, color: "#506176", lineHeight: 1.8 }}>
            <div>현재는 row virtualization 중심으로 성능 기준선을 잡고 있습니다.</div>
            <div>다음 단계에서는 pinned column과 sticky shadow를 함께 실험합니다.</div>
            <div>
              100,000 rows 시나리오를 바로 전환해 스크롤 체감과 렌더 수를 함께 확인할
              수 있습니다.
            </div>
          </div>
        </article>
      </section>

      <RealGridPerformanceLab />
    </section>
  );
}

function StatCard(props: { label: string; value: string }) {
  return (
    <article className="stat-card">
      <div className="stat-card__label">{props.label}</div>
      <strong className="stat-card__value">{props.value}</strong>
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
        background: props.sticky ? "#f6fbff" : undefined,
        zIndex: props.sticky ? 1 : undefined,
      }}
    >
      {props.children}
    </div>
  );
}
