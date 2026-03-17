import type { GridDensity } from "@vibe-grid/core";

export type GridDensityMetrics = {
  rowHeight: number;
  cellPaddingBlock: number;
  cellPaddingInline: number;
  rowStatePaddingBlock: number;
  rowStatePaddingInline: number;
};

export const GRID_DENSITY_METRICS: Record<GridDensity, GridDensityMetrics> = {
  compact: {
    rowHeight: 36,
    cellPaddingBlock: 8,
    cellPaddingInline: 14,
    rowStatePaddingBlock: 4,
    rowStatePaddingInline: 8,
  },
  default: {
    rowHeight: 42,
    cellPaddingBlock: 12,
    cellPaddingInline: 18,
    rowStatePaddingBlock: 6,
    rowStatePaddingInline: 10,
  },
  comfortable: {
    rowHeight: 52,
    cellPaddingBlock: 16,
    cellPaddingInline: 20,
    rowStatePaddingBlock: 8,
    rowStatePaddingInline: 12,
  },
};

export function resolveGridDensityMetrics(
  density: GridDensity | undefined,
): GridDensityMetrics {
  return GRID_DENSITY_METRICS[density ?? "default"];
}
