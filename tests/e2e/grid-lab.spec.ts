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

  test("applies and clears the in-grid filter row", async ({ page }) => {
    await page.goto("/labs/grid");

    await expect(page.getByTestId("grid-filter-row")).toBeVisible();

    await page.getByTestId("filter-input-sampleCode").fill("HR-012");
    await page.getByTestId("filter-apply-sampleCode").click();

    await expect(page.getByTestId("query-preview")).toContainText('"field": "sampleCode"');
    await expect(page.getByTestId("query-preview")).toContainText('"value": "HR-012"');

    await page.getByTestId("filter-clear-sampleCode").click();
    await expect(page.getByTestId("query-preview")).not.toContainText(
      '"field": "sampleCode"',
    );

    await page.getByTestId("filter-input-useYn").selectOption("N");
    await expect(page.getByTestId("query-preview")).toContainText('"field": "useYn"');
    await expect(page.getByTestId("query-preview")).toContainText('"value": "N"');
  });

  test("reports keyboard range selection and invalid paste summary", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("grid-cell-HR-001-sampleCode").click();
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.up("Shift");

    await expect(page.getByTestId("vibe-grid")).toHaveAttribute("data-range-rows", "2");
    await expect(page.getByTestId("vibe-grid")).toHaveAttribute(
      "data-range-columns",
      "2",
    );
    await expect(page.getByTestId("range-summary")).toContainText("2 x 2");

    await page.getByTestId("grid-cell-HR-001-sortOrder").click();
    await page.getByTestId("paste-textarea").fill("abc");
    await page.getByTestId("paste-apply").click();

    await expect(page.getByTestId("paste-summary")).toContainText("validation errors: 1");
    await expect(page.getByTestId("paste-summary")).toContainText("sortOrder");
    await expect(page.getByTestId("grid-cell-HR-001-sortOrder")).toHaveText("1");
  });

  test("supports drag range selection and range copy", async ({ page }) => {
    await page.addInitScript(() => {
      const state = { copiedText: "" };

      Object.defineProperty(window, "__vibeGridClipboardState", {
        configurable: true,
        value: state,
      });

      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            state.copiedText = text;
          },
          readText: async () => state.copiedText,
        },
      });
    });

    await page.goto("/labs/grid");

    const startCell = page.getByTestId("grid-cell-HR-001-sampleCode");
    const endCell = page.getByTestId("grid-cell-HR-002-sampleName");

    await startCell.hover();
    await page.mouse.down();
    await endCell.hover();
    await page.mouse.up();

    await expect(page.getByTestId("vibe-grid")).toHaveAttribute("data-range-rows", "2");
    await expect(page.getByTestId("vibe-grid")).toHaveAttribute(
      "data-range-columns",
      "2",
    );
    await expect(page.getByTestId("range-summary")).toContainText("2 x 2");

    await page.keyboard.press("Control+C");

    const copiedText = await page.evaluate(() => {
      return (
        (window as Window & { __vibeGridClipboardState?: { copiedText?: string } })
          .__vibeGridClipboardState?.copiedText ?? ""
      );
    });

    expect(copiedText.split("\n")).toHaveLength(2);
    expect(copiedText.split("\n").every((row) => row.split("\t").length === 2)).toBeTruthy();
    expect(copiedText).toContain("HR-001");
    expect(copiedText).toContain("HR-002");
  });
});
