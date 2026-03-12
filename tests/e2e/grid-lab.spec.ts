import { expect, test } from "@playwright/test";

test.describe("Grid Lab", () => {
  test("runs the core row workflow", async ({ page }) => {
    await page.goto("/labs/grid");

    await expect(page.getByTestId("status-panel")).toBeVisible();

    await page.getByTestId("command-insert").click();
    await expect(page.getByTestId("status-panel")).toContainText(/입력|신규/);

    await page.getByTestId("command-copyRow").click();
    await expect(page.getByTestId("status-panel")).toContainText(/복사/);

    await page.getByTestId("command-save").click();
    await expect(page.getByTestId("save-bundle-preview")).toContainText("inserted");
  });

  test("applies server filtering and paste flow", async ({ page }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("filter-keyword").fill("HR-001");
    await page.getByTestId("server-search").click();
    await expect(page.getByTestId("status-panel")).toContainText(/서버|조건 조회/);

    await page
      .getByTestId("paste-textarea")
      .fill(
        [
          "HR-901\t테스트행\t인사운영팀\t사원\tY\t901\t자동테스트",
          "HR-902\t테스트행2\t평가보상팀\t책임\tN\t902\t붙여넣기",
        ].join("\n"),
      );
    await page.getByTestId("paste-apply").click();

    await expect(page.getByTestId("status-panel")).toContainText(/붙여넣기|반영/);
  });

});
