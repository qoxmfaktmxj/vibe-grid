import { createDefaultCommandRegistry, getScaffoldStatus } from "@vibe-grid/core";

export function VibeGridPlaceholder() {
  const status = getScaffoldStatus();
  const starterCommands = createDefaultCommandRegistry("ko-KR");

  return (
    <section style={{ border: "1px solid #dbe3ef", borderRadius: 20, padding: 24, background: "#fff" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{ padding: "6px 12px", borderRadius: 999, background: "#0f172a", color: "#fff", fontSize: 12 }}>
          {status.phase}
        </span>
        <span style={{ padding: "6px 12px", borderRadius: 999, background: "#e0f2fe", color: "#075985", fontSize: 12 }}>
          {status.engine}
        </span>
      </div>
      <h2 style={{ margin: 0, fontSize: 28 }}>VibeGrid scaffold is ready.</h2>
      <p style={{ marginTop: 12, color: "#475569", lineHeight: 1.7 }}>
        Public contracts live in <code>@vibe-grid/core</code>. Apps should consume
        the product surface, not the table engine.
      </p>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginTop: 20 }}>
        {starterCommands.map((command) => (
          <div key={command.id} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, background: "#f8fafc" }}>
            <strong>{command.label}</strong>
            <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
              {command.legacyCode}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
