import { expect, test } from "@playwright/test";

test("Compatibility Lab shows the IBSheet8 matrix and source references", async ({
  page,
}) => {
  await page.goto("/labs/compatibility");

  await expect(
    page.getByRole("heading", { name: "IBSheet8 호환성 매트릭스" }),
  ).toBeVisible();
  await expect(page.getByTestId("compatibility-summary")).toContainText("구현 완료");
  await expect(page.getByTestId("compatibility-summary")).toContainText("부분 구현");
  await expect(page.getByTestId("compatibility-summary")).toContainText("다음 단계");

  await expect(page.getByRole("link", { name: "Grid Lab" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Bench" })).toBeVisible();

  const matrix = page.getByTestId("compatibility-matrix");
  await expect(matrix).toContainText("행 선택 + 범위 선택 + 복사/붙여넣기");
  await expect(matrix).toContainText("저장 번들 / 변경 상태 분리");
  await expect(matrix).toContainText("날짜 editor + host date policy");
  await expect(matrix).toContainText("HeaderCheck 전체 체크");
  await expect(matrix).toContainText("Group / Tree / Pivot 계열");

  const sources = page.getByTestId("compatibility-sources");
  await expect(sources).toContainText("basic-course.html");
  await expect(sources).toContainText("header.html");
  await expect(sources).toContainText("on-before-paste.html / on-after-paste.html");
});
