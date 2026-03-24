"use client";

import { useState } from "react";
import { RealGridPerformanceLab } from "./RealGridPerformanceLab";
import { TreeBenchPerformanceLab } from "./TreeBenchPerformanceLab";

export function BenchWorkbench() {
  const [tab, setTab] = useState<"flat" | "tree">("flat");

  return (
    <section style={{ display: "grid", gap: 24 }}>
      <section className="hero-panel hero-panel--teal" style={{ margin: "0 48px" }}>
        <div className="hero-eyebrow">
          <span className="hero-tag">P5 기준선</span>
          <span className="hero-tag">실제 VibeGrid 경로</span>
          <span className="hero-tag">행 가상 스크롤 활성화</span>
        </div>
        <h1 className="hero-title">Vibe Grid 성능 벤치</h1>
        <p className="hero-copy">
          렌더 경로에서 고정 컬럼, 스티키 헤더, 필터 행, 범위 선택, 가상 스크롤이
          함께 켜진 상태를 측정합니다. 단순한 리스트 벤치마크가 아니라, 기능이 결합된
          실제 제품 셸이 부하 상황에서도 반응성을 유지하는지 확인합니다.
        </p>
      </section>

      <div className="segmented-row" style={{ padding: "0 48px" }}>
        <button
          className={`segmented-button${tab === "flat" ? " segmented-button--active" : ""}`}
          data-testid="bench-tab-flat"
          onClick={() => setTab("flat")}
        >
          Flat
        </button>
        <button
          className={`segmented-button${tab === "tree" ? " segmented-button--active" : ""}`}
          data-testid="bench-tab-tree"
          onClick={() => setTab("tree")}
        >
          Tree
        </button>
      </div>

      {tab === "flat" && <RealGridPerformanceLab />}
      {tab === "tree" && <TreeBenchPerformanceLab />}
    </section>
  );
}
