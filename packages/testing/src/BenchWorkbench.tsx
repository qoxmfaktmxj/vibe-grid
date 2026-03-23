"use client";

import { RealGridPerformanceLab } from "./RealGridPerformanceLab";

export function BenchWorkbench() {
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

      <RealGridPerformanceLab />
    </section>
  );
}
