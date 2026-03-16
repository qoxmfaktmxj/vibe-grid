"use client";

import { RealGridPerformanceLab } from "./RealGridPerformanceLab";

export function BenchWorkbench() {
  return (
    <section style={{ display: "grid", gap: 24 }}>
      <section className="hero-panel hero-panel--mint">
        <div className="hero-eyebrow">
          <span className="hero-tag hero-tag--light">벤치</span>
          <span className="hero-tag hero-tag--light">실제 VibeGrid 경로</span>
          <span className="hero-tag hero-tag--light">붙여넣기 활성화</span>
        </div>
        <h1 className="hero-title">VibeGrid 성능 벤치</h1>
        <p className="hero-copy hero-copy--dark">
          이 화면은 실제 `VibeGrid` 제품 경로만 집중적으로 검증합니다. 고정 컬럼, 필터 행,
          범위 선택, 직접 붙여넣기, 삭제 체크, 저장 번들 생성, 행 가상 스크롤을 같은
          표면에서 함께 확인할 수 있습니다.
        </p>
      </section>

      <RealGridPerformanceLab />
    </section>
  );
}
