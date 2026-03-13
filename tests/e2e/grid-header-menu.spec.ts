import { expect, test } from "@playwright/test";

test.describe("Grid Header Menu", () => {
  test("opens by click and right-click, shows filtered state, pins, resizes, persists, sorts, and hides columns", async ({
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

    const sampleCodeHeader = page.getByTestId("header-cell-sampleCode");
    const resizeHandle = page.getByTestId("header-resize-handle-sampleCode");
    const beforeWidth = Number(
      (await sampleCodeHeader.getAttribute("data-column-width")) ?? "0",
    );

    const handleBox = await resizeHandle.boundingBox();
    if (!handleBox) {
      throw new Error("Resize handle bounding box was not available.");
    }

    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      handleBox.x + handleBox.width / 2 + 48,
      handleBox.y + handleBox.height / 2,
    );
    await page.mouse.up();

    const afterWidth = Number(
      (await sampleCodeHeader.getAttribute("data-column-width")) ?? "0",
    );
    expect(afterWidth).toBeGreaterThan(beforeWidth);

    await page.getByTestId("header-menu-trigger-sampleCode").click();
    await page.getByTestId("header-menu-action-sampleCode-sortDesc").click();
    await expect(page.locator('td[data-column-key="sampleCode"]').first()).toHaveText(
      "HR-120",
    );

    await page.getByTestId("header-menu-trigger-note").click();
    await page.getByTestId("header-menu-action-note-hide").click();
    await expect(page.getByTestId("header-cell-note")).toHaveCount(0);

    await page.reload();
    await expect(page.getByTestId("header-cell-sampleName")).toHaveAttribute(
      "data-column-pinned",
      "left",
    );
    await expect(page.getByTestId("header-cell-sampleCode")).toHaveAttribute(
      "data-column-width",
      String(afterWidth),
    );
    await expect(page.getByTestId("header-cell-note")).toHaveCount(0);
  });
});
