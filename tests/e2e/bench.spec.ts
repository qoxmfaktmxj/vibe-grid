import { expect, test } from "@playwright/test";

test("Bench exposes combined-feature performance signals on the real grid path", async ({
  page,
}) => {
  await page.goto("/labs/bench");

  const lab = page.getByTestId("real-grid-performance-lab");
  await expect(lab).toBeVisible();

  await page.getByTestId("real-grid-scenario-100000").click();
  await expect(page.getByTestId("real-grid-visible-rows")).toContainText("100,000");
  await expect(page.getByTestId("real-grid-scenario-ms")).not.toContainText("-");

  const grid = lab.getByTestId("vibe-grid");
  await expect(grid).toHaveAttribute("data-virtualized", "true");
  await expect(grid).toHaveAttribute("data-total-row-count", "100000");
  await expect(grid).toHaveAttribute("data-row-height", "42");
  await expect(grid).toHaveAttribute("data-filter-row-enabled", "true");
  await expect(grid).toHaveAttribute("data-row-check-enabled", "true");
  await expect(grid).toHaveAttribute("data-edit-activation", "doubleClick");
  await expect(page.getByTestId("real-grid-row-height")).toContainText("42px");
  await expect(page.getByTestId("real-grid-filter-row")).toContainText("활성화");
  await expect(page.getByTestId("real-grid-edit-activation")).toContainText("더블클릭");
  await expect(page.getByTestId("real-grid-paste-mode")).toContainText("수정 가능 셀만");

  const renderedRowCount = Number(
    (await grid.getAttribute("data-rendered-row-count")) ?? "0",
  );
  expect(renderedRowCount).toBeGreaterThan(0);
  expect(renderedRowCount).toBeLessThan(200);

  await lab.getByTestId("header-check-all").check();
  await expect(grid).toHaveAttribute("data-selected-row-count", "100000");
  await lab.getByTestId("header-check-all").uncheck();
  await expect(grid).toHaveAttribute("data-selected-row-count", "0");

  await lab.getByTestId("grid-cell-row-1-employeeNo").click();
  await page.keyboard.down("Shift");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.up("Shift");

  await expect(grid).toHaveAttribute("data-range-rows", "2");
  await expect(page.getByTestId("real-grid-selection-ms")).not.toContainText("-");

  await lab.getByTestId("filter-input-department").selectOption("인사운영");
  await expect(page.getByTestId("real-grid-visible-rows")).toContainText("50,000");
  await expect(grid).toHaveAttribute("data-filter-count", "1");
  await expect(page.getByTestId("real-grid-filter-ms")).not.toContainText("-");

  await lab.getByTestId("header-menu-trigger-employeeName").click();
  await expect(lab.getByTestId("header-menu-employeeName")).toBeVisible();
  await lab.getByTestId("header-menu-action-employeeName-pinRight").click();

  await expect(grid).toHaveAttribute("data-pinned-right-count", "1");
  await expect(page.getByTestId("real-grid-pinned-summary")).toContainText("R 1");
  await expect(page.getByTestId("real-grid-column-ms")).not.toContainText("-");

  await lab.getByTestId("grid-cell-row-4-employeeName").click();
  await page.evaluate((text) => {
    const gridRoot = document.querySelector(
      '[data-testid="real-grid-performance-lab"] [data-testid="vibe-grid"]',
    );

    if (!(gridRoot instanceof HTMLElement)) {
      throw new Error("Bench grid root was not found.");
    }

    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
      value: {
        getData: (type: string) => (type === "text/plain" ? text : ""),
      },
    });
    gridRoot.dispatchEvent(event);
  }, ["벤치 붙여넣기 이름", "인사운영", "리드"].join("\t"));

  await expect(lab.getByTestId("grid-cell-row-4-employeeName")).toHaveText(
    "벤치 붙여넣기 이름",
  );
  await expect(lab.getByTestId("grid-cell-row-4-department")).toHaveText("인사운영");
  await expect(lab.getByTestId("grid-cell-row-4-jobTitle")).toHaveText("리드");
  await expect(page.getByTestId("real-grid-paste-summary")).toContainText("적용 3");

  await lab.getByTestId("delete-check-row-4").check();
  await expect(page.getByTestId("real-grid-state-deleted")).toContainText("1");

  await page.getByTestId("bench-build-save-bundle").click();
  await expect(page.getByTestId("bench-save-bundle-preview")).toContainText('"rowKey": "row-4"');
  await expect(page.getByTestId("bench-save-bundle-preview")).toContainText('"deleted"');
  await expect(page.getByTestId("bench-status-message")).toContainText("저장 번들 생성 완료");
});
