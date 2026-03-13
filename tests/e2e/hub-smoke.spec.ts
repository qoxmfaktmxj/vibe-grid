import { expect, test } from "@playwright/test";

test("Hub navigation exposes the primary lab surfaces", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "한 포트 검증 허브" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Grid Lab" }).click();
  await expect(page).toHaveURL(/\/labs\/grid$/);
  await expect(page.getByTestId("vibe-grid")).toBeVisible();

  await page.getByRole("link", { name: "Bench" }).click();
  await expect(page).toHaveURL(/\/labs\/bench$/);
  await expect(page.getByTestId("real-grid-performance-lab")).toBeVisible();

  await page.getByRole("link", { name: "Compatibility" }).click();
  await expect(page).toHaveURL(/\/labs\/compatibility$/);
  await expect(
    page.getByRole("heading", { name: "IBSheet 비교 매트릭스" }),
  ).toBeVisible();
});
