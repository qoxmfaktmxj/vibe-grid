export const vibeGridSurfaceClassName =
  "rounded-[28px] border border-slate-200 bg-white shadow-sm";

export const vibeGridThemeTokens = {
  header: {
    idleBackground: "#f8fafc",
    sortedBackground: "#f8fffd",
    filteredBackground: "#f5fbff",
    pinnedBackground: "#f0fdfa",
    menuOpenBackground: "#eef6ff",
    borderColor: "#d9e4f1",
    textColor: "#0f172a",
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
} as const;
