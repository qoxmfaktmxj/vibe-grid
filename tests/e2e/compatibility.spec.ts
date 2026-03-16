import { expect, test } from "@playwright/test";

test("Compatibility Lab shows the IBSheet8 matrix and experimental previews", async ({
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

  await expect(page.getByTestId("compatibility-group-demo")).toContainText("Group Preview");
  await expect(page.getByTestId("compatibility-group-demo")).toContainText("인사운영");
  await expect(page.getByTestId("compatibility-tree-demo")).toContainText("Tree Preview");
  await expect(page.getByTestId("compatibility-tree-demo")).toContainText("인사운영팀");
  await expect(page.getByTestId("compatibility-pivot-demo")).toContainText("Pivot Preview");
  await expect(page.getByTestId("compatibility-pivot-demo")).toContainText("매니저");
  await expect(page.getByTestId("compatibility-tree-runtime")).toContainText("Tree Runtime MVP");
  await expect(page.getByTestId("compatibility-tree-runtime")).toContainText("조직운영팀");
  await expect(page.getByTestId("tree-runtime-visible-count")).toContainText("표시 행 4");

  await page.getByTestId("tree-toggle-org-hr").click();
  await expect(page.getByTestId("compatibility-tree-runtime")).not.toContainText("조직운영팀");
  await expect(page.getByTestId("tree-runtime-visible-count")).toContainText("표시 행 2");

  await page.getByTestId("tree-toggle-org-hr").click();
  await expect(page.getByTestId("compatibility-tree-runtime")).toContainText("조직운영팀");
  await expect(page.getByTestId("tree-runtime-visible-count")).toContainText("표시 행 4");

  const matrix = page.getByTestId("compatibility-matrix");
  await expect(matrix).toContainText("행 선택 + 범위 선택 + 복사/붙여넣기");
  await expect(matrix).toContainText("저장 번들 / 변경 상태 분리");
  await expect(matrix).toContainText("날짜 editor + host date policy");
  await expect(matrix).toContainText("HeaderCheck 전체 체크");
  await expect(matrix).toContainText("Tree runtime MVP");
  await expect(matrix).toContainText("Group / Pivot 계열");
  await expect(matrix).toContainText("IBSheet public event parity");
  await expect(matrix).toContainText("experimental public surface");

  const sources = page.getByTestId("compatibility-sources");
  await expect(sources).toContainText("basic-course.html");
  await expect(sources).toContainText("header.html");
  await expect(sources).toContainText("on-before-paste.html / on-after-paste.html");
});
