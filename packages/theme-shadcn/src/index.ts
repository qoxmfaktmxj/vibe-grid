export const vibeGridSurfaceClassName =
  "rounded-[12px] bg-white shadow-sm";

export type VibeGridThemeTokens = typeof vibeGridThemeTokens;

export type VibeGridThemeOptions = {
  fontFamily?: string;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    return {
      r: parseInt(cleaned[0] + cleaned[0], 16),
      g: parseInt(cleaned[1] + cleaned[1], 16),
      b: parseInt(cleaned[2] + cleaned[2], 16),
    };
  }
  if (cleaned.length === 6) {
    return {
      r: parseInt(cleaned.slice(0, 2), 16),
      g: parseInt(cleaned.slice(2, 4), 16),
      b: parseInt(cleaned.slice(4, 6), 16),
    };
  }
  return null;
}

function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const DEFAULT_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Malgun Gothic", sans-serif';

/**
 * primary color에서 그리드 테마 토큰을 자동 생성합니다.
 * 호스트 앱의 primary color를 넘기면 선택/활성/범위 색상이 자동으로 유도됩니다.
 *
 * @example
 * ```ts
 * // 기본 테마 (파란 계열)
 * const theme = createVibeGridTheme();
 *
 * // 프로젝트 primary color 적용
 * const theme = createVibeGridTheme("#0f766e"); // teal
 * const theme = createVibeGridTheme("#7c3aed"); // violet
 *
 * // 커스텀 폰트 적용 (소비 앱에서 @font-face 로드 필요)
 * const theme = createVibeGridTheme("#001641", {
 *   fontFamily: '"Pretendard", "Noto Sans KR", system-ui, sans-serif',
 * });
 * ```
 */
export function createVibeGridTheme(
  primaryColor: string = "#001641",
  options?: VibeGridThemeOptions,
): VibeGridThemeTokens {
  const primary = primaryColor;
  const primaryDark = darken(primary, 0.2);
  const primaryLight = lighten(primary, 0.85);
  const primaryLighter = lighten(primary, 0.92);

  return {
    typography: {
      fontFamily: options?.fontFamily ?? DEFAULT_FONT_FAMILY,
    },
    surface: {
      borderColor: "rgba(196, 198, 210, 0.18)",
      background: "#ffffff",
      shellBackground: "#f7f9fb",
      shadow: "0 24px 48px rgba(25, 28, 30, 0.06)",
    },
    header: {
      idleBackground: "#e6e8ea",
      hoverBackground: "#dde0e3",
      sortedBackground: primaryLighter,
      filteredBackground: primaryLighter,
      pinnedBackground: lighten(primary, 0.9),
      menuOpenBackground: primaryLight,
      borderColor: "rgba(0, 0, 0, 0.12)",
      textColor: "#374151",
      hoverTextColor: "#1f2937",
      activeTextColor: primary,
      resizeHandleIdle: "rgba(81, 95, 116, 0.28)",
      resizeHandleHover: rgba(primary, 0.6),
      resizeHandlePinnedSorted: rgba(primary, 0.4),
    },
    indicator: {
      idleText: "#9ca3af",
      sortedText: primaryDark,
      pinnedText: primaryDark,
      filteredText: primary,
      filteredBackground: primaryLight,
      filteredBorder: rgba(primary, 0.18),
    },
    menu: {
      borderColor: "rgba(196, 198, 210, 0.18)",
      background: "rgba(255,255,255,0.86)",
      shadow: "0 32px 48px rgba(25, 28, 30, 0.08)",
      triggerIdleBorder: "1px solid rgba(196, 198, 210, 0.28)",
      triggerOpenBorder: `1px solid ${rgba(primary, 0.15)}`,
      triggerIdleBackground: "rgba(255,255,255,0.88)",
      triggerOpenBackground: primaryLight,
      textColor: "#515f74",
      itemHoverBackground: "#f3f4f6",
      itemDisabledColor: "#9ca3af",
    },
    filter: {
      rowBackground: "#f8fafb",
      cellBackground: "#ffffff",
      inputBackground: "#ffffff",
      inputBorder: "#d1d5db",
      inputBorderFocus: primary,
      inputFocusRing: rgba(primary, 0.2),
      inputHasValueBackground: lighten(primary, 0.96),
      inputText: "#191c1e",
      invalidBorder: "#ba1a1a",
      applyBackground: primaryLight,
      applyText: primaryDark,
      clearBackground: "#ffffff",
      clearText: "#515f74",
      clearBorder: "rgba(196, 198, 210, 0.32)",
    },
    body: {
      rowOddBackground: "#ffffff",
      rowEvenBackground: "#f2f4f6",
      rowHoverBackground: "#f8f9fa",
      selectedRowBackground: rgba(primary, 0.12),
      activeRowBackground: rgba(primary, 0.18),
      rangeBackground: rgba(primary, 0.16),
      activeCellBackground: "rgba(255,255,255,0.9)",
      cellBorderColor: "rgba(0, 0, 0, 0.08)",
      cellTextColor: "#374151",
      activeTextColor: "#1f2937",
      editingTextColor: "#111827",
      readOnlyTextColor: "#6b7280",
      deletedCellTextColor: "#94a3b8",
      emptyBackground: "#ffffff",
      emptyTextColor: "#515f74",
      spacerBackground: "#ffffff",
      activeCellOutline: primary,
    },
    sticky: {
      boundaryColor: "rgba(196, 198, 210, 0.22)",
      boundaryShadow: "rgba(25, 28, 30, 0.12)",
      rangeOutline: primary,
    },
    editor: {
      borderColor: primary,
      background: "#ffffff",
      borderRadius: 8,
    },
    rowState: {
      N: { background: "#f0fdf4", color: "#166534" },
      I: { background: "#eff6ff", color: "#1d4ed8" },
      U: { background: "#fefce8", color: "#854d0e" },
      D: { background: "#fef2f2", color: "#991b1b" },
    },
  };
}

/** 기본 테마 (하위 호환) */
export const vibeGridThemeTokens = createVibeGridTheme();
