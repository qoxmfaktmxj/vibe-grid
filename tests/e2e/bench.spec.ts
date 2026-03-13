import { expect, test } from "@playwright/test";

test("Bench exposes the real VibeGrid performance lab", async ({ page }) => {
  await page.goto("/labs/bench");

  const lab = page.getByTestId("real-grid-performance-lab");
  await expect(lab).toBeVisible();

  await page.getByTestId("real-grid-scenario-1000").click();
  await expect(page.getByTestId("real-grid-visible-rows")).toContainText("1,000");

  const grid = lab.getByTestId("vibe-grid");
  await lab.getByTestId("grid-cell-row-1-employeeNo").click();
  await page.keyboard.down("Shift");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.up("Shift");

  await expect(grid).toHaveAttribute("data-range-rows", "2");

  await lab.getByTestId("filter-input-department").selectOption("HR Operations");
  await expect(page.getByTestId("real-grid-visible-rows")).toContainText("500");

  await lab.getByTestId("header-menu-trigger-employeeName").click();
  await expect(lab.getByTestId("header-menu-employeeName")).toBeVisible();
});
