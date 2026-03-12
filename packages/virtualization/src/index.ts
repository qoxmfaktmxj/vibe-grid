/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useVirtualizer } from "@tanstack/react-virtual";

export const DEFAULT_ROW_HEIGHT = 42;
export const DEFAULT_HEADER_HEIGHT = 44;

export type VirtualizationPreset = {
  rowHeight: number;
  headerHeight: number;
  overscan: number;
};

export const defaultVirtualizationPreset: VirtualizationPreset = {
  rowHeight: DEFAULT_ROW_HEIGHT,
  headerHeight: DEFAULT_HEADER_HEIGHT,
  overscan: 8,
};

export function useVirtualRows(input: {
  count: number;
  getScrollElement: () => HTMLElement | null;
  rowHeight?: number;
  overscan?: number;
}) {
  return useVirtualizer({
    count: input.count,
    getScrollElement: input.getScrollElement,
    estimateSize: () => input.rowHeight ?? DEFAULT_ROW_HEIGHT,
    overscan: input.overscan ?? defaultVirtualizationPreset.overscan,
  });
}
