import { expect, test } from "@playwright/test";

test("Compatibility Lab shows the IBSheet matrix", async ({ page }) => {
  await page.goto("/labs/compatibility");

  await expect(
    page.getByRole("heading", { name: "IBSheet 비교 매트릭스" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Grid Lab" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Bench" })).toBeVisible();
  await expect(page.getByText("행 선택 중심 UX")).toBeVisible();
  await expect(page.getByText("컬럼 기능 4종")).toBeVisible();
  await expect(page.getByText("헤더 메뉴 / 필터 행")).toBeVisible();
  await expect(page.getByText("자동 회귀 테스트")).toBeVisible();
  await expect(page.getByText("구현됨").first()).toBeVisible();
  await expect(page.getByText("부분 구현").first()).toBeVisible();
  await expect(page.getByText("다음").first()).toBeVisible();
});
