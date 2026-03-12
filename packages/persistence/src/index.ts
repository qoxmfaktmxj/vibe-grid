export type GridPreferenceState = {
  columnOrder: string[];
  hiddenColumns: string[];
  pinnedColumns: {
    left: string[];
    right: string[];
  };
};

export const emptyGridPreferenceState: GridPreferenceState = {
  columnOrder: [],
  hiddenColumns: [],
  pinnedColumns: {
    left: [],
    right: [],
  },
};
