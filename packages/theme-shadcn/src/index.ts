export const vibeGridSurfaceClassName =
  "rounded-[28px] border border-slate-200 bg-white shadow-sm";

export const vibeGridThemeTokens = {
  surface: {
    borderColor: "#d9e4f1",
    background: "#ffffff",
    shadow: "0 16px 50px rgba(15, 23, 42, 0.08)",
  },
  header: {
    idleBackground: "#f8fafc",
    sortedBackground: "#f8fffd",
    filteredBackground: "#f5fbff",
    pinnedBackground: "#f0fdfa",
    menuOpenBackground: "#eef6ff",
    borderColor: "#d9e4f1",
    textColor: "#0f172a",
    resizeHandleIdle: "rgba(148,163,184,0.5)",
    resizeHandlePinnedSorted: "rgba(15,118,110,0.45)",
  },
  indicator: {
    idleText: "#cbd5e1",
    sortedText: "#0f766e",
    pinnedText: "#0f766e",
    filteredText: "#1d4ed8",
    filteredBackground: "#dbeafe",
    filteredBorder: "rgba(59,130,246,0.22)",
  },
  menu: {
    borderColor: "rgba(148, 163, 184, 0.28)",
    background: "rgba(255,255,255,0.98)",
    shadow: "0 18px 36px rgba(15, 23, 42, 0.16)",
    triggerIdleBorder: "1px solid rgba(203, 213, 225, 0.8)",
    triggerOpenBorder: "1px solid rgba(14,165,233,0.3)",
    triggerIdleBackground: "rgba(255,255,255,0.92)",
    triggerOpenBackground: "#eff6ff",
    textColor: "#334155",
  },
  body: {
    rowBackground: "#ffffff",
    selectedRowBackground: "rgba(14,165,233,0.06)",
    activeRowBackground: "rgba(14,165,233,0.12)",
    rangeBackground: "rgba(20,184,166,0.12)",
    activeCellBackground: "#e0f2fe",
    cellBorderColor: "#eef2f7",
    cellTextColor: "#0f172a",
    deletedCellTextColor: "#94a3b8",
    emptyBackground: "#ffffff",
    emptyTextColor: "#64748b",
    spacerBackground: "#ffffff",
    activeCellOutline: "#0ea5e9",
  },
  sticky: {
    boundaryColor: "#d9e4f1",
    boundaryShadow: "rgba(15, 23, 42, 0.32)",
    rangeOutline: "#14b8a6",
  },
  editor: {
    borderColor: "#38bdf8",
    background: "#ffffff",
    borderRadius: 10,
  },
  rowState: {
    N: { background: "#eff6ff", color: "#1d4ed8" },
    I: { background: "#ecfdf5", color: "#047857" },
    U: { background: "#fff7ed", color: "#c2410c" },
    D: { background: "#fef2f2", color: "#b91c1c" },
  },
} as const;
