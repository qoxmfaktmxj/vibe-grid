import { expect, test } from "@playwright/test";

test("Hub navigation exposes the primary lab surfaces", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".app-title")).toBeVisible();

  await page.getByRole("link", { name: "Grid Lab" }).click();
  await expect(page).toHaveURL(/\/labs\/grid$/);
  await expect(page.getByTestId("vibe-grid")).toBeVisible();

  await page.getByRole("link", { name: "Employee Batch" }).click();
  await expect(page).toHaveURL(/\/labs\/employee-batch$/);
  await expect(page.getByTestId("employee-batch-workbench")).toBeVisible();

  await page.getByRole("link", { name: "Bench" }).click();
  await expect(page).toHaveURL(/\/labs\/bench$/);
  await expect(page.getByTestId("real-grid-performance-lab")).toBeVisible();

  await page.getByRole("link", { name: "Compatibility" }).click();
  await expect(page).toHaveURL(/\/labs\/compatibility$/);
  await expect(page.getByTestId("compatibility-summary")).toBeVisible();
});
