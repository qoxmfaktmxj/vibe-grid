"use client";

import { useMemo, useState } from "react";
import {
  createGridTreeState,
  createLoadedRow,
  type GridSelectionState,
  type GridTreeState,
  type ManagedGridRow,
  type VibeGridColumn,
} from "@vibe-grid/core";
import { VibeGrid } from "@vibe-grid/react";

type TreeRuntimeRow = {
  id: string;
  parentId: string | null;
  name: string;
  headcount: number;
  leader: string;
};

const treeRuntimeColumns: VibeGridColumn<TreeRuntimeRow>[] = [
  {
    key: "name",
    header: "조직명",
    width: 260,
    minWidth: 220,
    sortable: true,
  },
  {
    key: "headcount",
    header: "인원",
    width: 120,
    minWidth: 100,
    sortable: true,
  },
  {
    key: "leader",
    header: "책임자",
    width: 180,
    minWidth: 140,
    sortable: true,
  },
];

const treeRuntimeRows: ManagedGridRow<TreeRuntimeRow>[] = [
  createLoadedRow("corp", {
    id: "corp",
    parentId: null,
    name: "본사",
    headcount: 42,
    leader: "대표이사",
  }),
  createLoadedRow("org-hr", {
    id: "org-hr",
    parentId: "corp",
    name: "인사본부",
    headcount: 18,
    leader: "상무",
  }),
  createLoadedRow("org-ops", {
    id: "org-ops",
    parentId: "org-hr",
    name: "조직운영팀",
    headcount: 9,
    leader: "팀장",
  }),
  createLoadedRow("org-reward", {
    id: "org-reward",
    parentId: "org-hr",
    name: "보상기획팀",
    headcount: 9,
    leader: "팀장",
  }),
];

export function CompatibilityTreeRuntimeDemo() {
  const [treeState, setTreeState] = useState<GridTreeState>(() =>
    createGridTreeState({
      expandedRowKeys: ["corp", "org-hr"],
    }),
  );
  const [selectionState, setSelectionState] = useState<GridSelectionState>();
  const expandedCount = treeState.expandedRowKeys.length;
  const visibleRowCount = useMemo(() => {
    let count = 1;

    if (treeState.expandedRowKeys.includes("corp")) {
      count += 1;
    }

    if (
      treeState.expandedRowKeys.includes("corp") &&
      treeState.expandedRowKeys.includes("org-hr")
    ) {
      count += 2;
    }

    return count;
  }, [treeState.expandedRowKeys]);

  return (
    <section className="section-panel" data-testid="compatibility-tree-runtime">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div>
          <h3 className="section-panel__title">Tree Runtime MVP</h3>
          <p className="section-panel__copy">
            preview helper가 아니라 실제 `VibeGrid` runtime 경로로 tree 렌더를 검증하는
            샘플입니다.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span className="status-pill" data-state="partial">
            runtime partial
          </span>
          <span className="hero-tag hero-tag--light" data-testid="tree-runtime-visible-count">
            표시 행 {visibleRowCount}
          </span>
          <span className="hero-tag hero-tag--light" data-testid="tree-runtime-expanded-count">
            펼침 {expandedCount}
          </span>
        </div>
      </div>

      <VibeGrid
        gridId="compatibility-tree-runtime"
        rows={treeRuntimeRows}
        columns={treeRuntimeColumns}
        selectionState={selectionState}
        onSelectionStateChange={setSelectionState}
        tree={{
          spec: {
            mode: "tree",
            rowKeyField: "id",
            parentRowKeyField: "parentId",
            labelField: "name",
            defaultExpandedRowKeys: ["corp", "org-hr"],
          },
          state: treeState,
          onStateChange: setTreeState,
        }}
        height={280}
        emptyMessage="트리 테스트 데이터가 없습니다."
      />
    </section>
  );
}
