"use client";

import { RealGridPerformanceLab } from "./RealGridPerformanceLab";

export function BenchWorkbench() {
  return (
    <section style={{ display: "grid", gap: 24 }}>
      <section className="hero-panel hero-panel--mint">
        <div className="hero-eyebrow">
          <span className="hero-tag hero-tag--light">Bench</span>
          <span className="hero-tag hero-tag--light">Actual VibeGrid path</span>
          <span className="hero-tag hero-tag--light">Paste enabled</span>
        </div>
        <h1 className="hero-title">VibeGrid performance bench</h1>
        <p className="hero-copy hero-copy--dark">
          This page now focuses on the actual `VibeGrid` product path only. Use it to
          verify combined behavior under load: pinning, filter row, range selection,
          direct paste, delete-check, save-bundle generation, and row virtualization on
          the real grid surface.
        </p>
      </section>

      <RealGridPerformanceLab />
    </section>
  );
}
