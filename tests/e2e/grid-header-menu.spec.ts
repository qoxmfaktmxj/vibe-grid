import { expect, test } from "@playwright/test";

test.describe("Grid Header Menu", () => {
  test("opens by click and right-click, shows filtered state, pins, sorts, and hides columns", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("header-menu-trigger-sampleName").click();
    await expect(page.getByTestId("header-menu-sampleName")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("header-menu-sampleName")).toHaveCount(0);

    await page.getByTestId("header-cell-sampleName").click({
      button: "right",
    });
    await expect(page.getByTestId("header-menu-sampleName")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByTestId("filter-input-sampleCode").fill("HR-012");
    await page.getByTestId("filter-apply-sampleCode").click();

    await expect(page.getByTestId("header-cell-sampleCode")).toHaveAttribute(
      "data-column-filtered",
      "true",
    );
    await expect(page.getByTestId("header-filter-indicator-sampleCode")).toHaveText("1");
    await page.getByTestId("filter-clear-sampleCode").click();

    await page.getByTestId("header-menu-trigger-sampleName").click();
    await page.getByTestId("header-menu-action-sampleName-pinLeft").click();
    await expect(page.getByTestId("header-cell-sampleName")).toHaveAttribute(
      "data-column-pinned",
      "left",
    );

    await page.getByTestId("header-menu-trigger-sampleCode").click();
    await page.getByTestId("header-menu-action-sampleCode-sortDesc").click();
    await expect(page.locator('td[data-column-key="sampleCode"]').first()).toHaveText(
      "HR-120",
    );

    await page.getByTestId("header-menu-trigger-note").click();
    await page.getByTestId("header-menu-action-note-hide").click();
    await expect(page.getByTestId("header-cell-note")).toHaveCount(0);

    await page.reload();
    await expect(page.getByTestId("header-cell-note")).toHaveCount(0);
  });
});
