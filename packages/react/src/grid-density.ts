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
    rowHeight: 30,
    cellPaddingBlock: 4,
    cellPaddingInline: 12,
    rowStatePaddingBlock: 2,
    rowStatePaddingInline: 6,
  },
  default: {
    rowHeight: 36,
    cellPaddingBlock: 8,
    cellPaddingInline: 14,
    rowStatePaddingBlock: 4,
    rowStatePaddingInline: 8,
  },
  comfortable: {
    rowHeight: 42,
    cellPaddingBlock: 12,
    cellPaddingInline: 18,
    rowStatePaddingBlock: 6,
    rowStatePaddingInline: 10,
  },
};

export function resolveGridDensityMetrics(
  density: GridDensity | undefined,
): GridDensityMetrics {
  return GRID_DENSITY_METRICS[density ?? "default"];
}
