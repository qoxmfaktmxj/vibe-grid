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
  await expect(grid).toHaveAttribute("data-edit-activation", "doubleClick");
  await expect(page.getByTestId("real-grid-row-height")).toContainText("42px");
  await expect(page.getByTestId("real-grid-filter-row")).toContainText("enabled");
  await expect(page.getByTestId("real-grid-edit-activation")).toContainText(
    "doubleClick",
  );

  const renderedRowCount = Number(
    (await grid.getAttribute("data-rendered-row-count")) ?? "0",
  );
  expect(renderedRowCount).toBeGreaterThan(0);
  expect(renderedRowCount).toBeLessThan(200);

  await lab.getByTestId("grid-cell-row-1-employeeNo").click();
  await page.keyboard.down("Shift");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.up("Shift");

  await expect(grid).toHaveAttribute("data-range-rows", "2");
  await expect(page.getByTestId("real-grid-selection-ms")).not.toContainText("-");

  await lab.getByTestId("filter-input-department").selectOption("HR Operations");
  await expect(page.getByTestId("real-grid-visible-rows")).toContainText("50,000");
  await expect(grid).toHaveAttribute("data-filter-count", "1");
  await expect(page.getByTestId("real-grid-filter-ms")).not.toContainText("-");

  await lab.getByTestId("header-menu-trigger-employeeName").click();
  await expect(lab.getByTestId("header-menu-employeeName")).toBeVisible();
  await lab.getByTestId("header-menu-action-employeeName-pinRight").click();

  await expect(grid).toHaveAttribute("data-pinned-right-count", "1");
  await expect(page.getByTestId("real-grid-pinned-summary")).toContainText("R 1");
  await expect(page.getByTestId("real-grid-column-ms")).not.toContainText("-");
});
