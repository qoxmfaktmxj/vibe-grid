import { expect, test } from "@playwright/test";

test("Compatibility Lab shows the IBSheet matrix", async ({ page }) => {
  await page.goto("/labs/compatibility");

  await expect(
    page.getByRole("heading", { name: "IBSheet 비교 매트릭스" }),
  ).toBeVisible();
  await expect(page.getByText("컬럼 기능 4종")).toBeVisible();
  await expect(page.getByText("자동 회귀 테스트")).toBeVisible();
  await expect(page.getByText("부분 구현").first()).toBeVisible();
});
