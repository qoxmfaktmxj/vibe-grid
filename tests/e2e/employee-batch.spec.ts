import { expect, test } from "@playwright/test";

test("Employee Batch validates exact selection, sync/async execution, and paging", async ({
  page,
}) => {
  await page.goto("/labs/employee-batch");

  const workbench = page.getByTestId("employee-batch-workbench");
  await expect(workbench).toBeVisible();

  const grid = workbench.getByTestId("vibe-grid");
  await expect(grid).toHaveAttribute("data-row-check-enabled", "true");
  await expect(page.getByTestId("employee-batch-summary-strip")).toContainText("전체 15,000행");

  await page.getByTestId("employee-batch-select-visible-10000").click();
  await expect(grid).toHaveAttribute("data-selected-row-count", "10000");
  await expect(page.getByTestId("employee-batch-selection-summary")).toContainText(
    "현재 선택: 10,000행",
  );

  await page.getByTestId("employee-batch-prepare-snapshot").click();
  await expect(page.getByTestId("employee-batch-request-preview")).toContainText(
    '"selectedCount": 10000',
  );
  await expect(page.getByTestId("employee-batch-request-preview")).toContainText(
    "EMPID-000001",
  );
  await expect(page.getByTestId("employee-batch-request-preview")).toContainText(
    '"targetIdsRenderedInDom": false',
  );

  await page.getByTestId("employee-batch-execute").click();
  await expect(page.getByTestId("employee-batch-result-status")).toContainText(
    "10,000명 작업이 즉시 완료되었습니다.",
  );

  await page.getByTestId("employee-batch-mode").selectOption("async");
  await page.getByTestId("employee-batch-execute").click();
  await expect(page.getByTestId("employee-batch-result-status")).toContainText(
    "jobId: HR-BATCH-10000-1",
  );

  await page.getByTestId("employee-batch-page-size").selectOption("100");
  await expect(page.getByTestId("employee-batch-page-summary")).toContainText(
    "페이지 1 / 총 150페이지",
  );
  await page.getByTestId("employee-batch-next-page").click();
  await expect(page.getByTestId("employee-batch-page-summary")).toContainText(
    "페이지 2 / 총 150페이지",
  );

  await workbench
    .getByTestId("header-cell-employeeName")
    .locator("button")
    .first()
    .click();
  await expect(page.getByTestId("employee-batch-page-summary")).toContainText(
    "employeeName asc",
  );

  await page.getByTestId("employee-batch-select-visible-10000").click();
  await page.getByTestId("employee-batch-sample-delete").click();
  await page.getByTestId("employee-batch-sample-update").click();
  await page.getByTestId("employee-batch-sample-insert").click();
  await expect(page.getByTestId("employee-batch-mutation-summary")).toContainText(
    "delete → update → insert",
  );
  await expect(page.getByTestId("employee-batch-mutation-summary")).not.toContainText(
    "delete:0 / update:0 / insert:0",
  );
});
