import { expect, test } from "@playwright/test";

test.describe("Grid Lab", () => {
  test("runs the core row workflow", async ({ page }) => {
    await page.goto("/labs/grid");

    const grid = page.getByTestId("vibe-grid");
    const initialRowCount = Number(
      (await grid.getAttribute("data-total-row-count")) ?? "0",
    );

    await page.getByTestId("command-insert").click();
    await expect(grid).toHaveAttribute(
      "data-total-row-count",
      String(initialRowCount + 1),
    );

    await page.getByTestId("command-copyRow").click();
    await expect(grid).toHaveAttribute(
      "data-total-row-count",
      String(initialRowCount + 2),
    );

    await page.getByTestId("command-save").click();
    await expect(page.getByTestId("save-bundle-preview")).toContainText("inserted");
  });

  test("toggles delete by dedicated check column and reflects the save bundle", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("delete-check-HR-001").click();
    await expect(page.getByTestId("grid-cell-HR-001-__rowState")).toContainText("삭제");

    await page.getByTestId("delete-check-HR-001").click();
    await expect(page.getByTestId("grid-cell-HR-001-__rowState")).toContainText("정상");

    await page.getByTestId("delete-check-HR-001").click();
    await expect(page.getByTestId("grid-cell-HR-001-__rowState")).toContainText("삭제");

    await page.getByTestId("command-save").click();
    await expect(page.getByTestId("save-bundle-preview")).toContainText('"deleted"');
    await expect(page.getByTestId("save-bundle-preview")).toContainText('"rowKey": "HR-001"');
  });

  test("supports HeaderCheck for visible-row selection and restore", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    const grid = page.getByTestId("vibe-grid");
    await expect(grid).toHaveAttribute("data-row-check-enabled", "true");
    await expect(grid).toHaveAttribute("data-selected-row-count", "1");

    await page.getByTestId("header-check-all").check();
    await expect(grid).toHaveAttribute("data-selected-row-count", "12");

    await page.getByTestId("row-check-HR-001").uncheck();
    await expect(grid).toHaveAttribute("data-selected-row-count", "11");

    await page.getByTestId("header-check-all").check();
    await expect(grid).toHaveAttribute("data-selected-row-count", "12");
  });

  test("applies append paste flow at the loaded row boundary", async ({ page }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("grid-cell-HR-012-sampleCode").click();
    await page.getByTestId("paste-row-overflow-policy").selectOption("append");
    await page
      .getByTestId("paste-textarea")
      .fill(
        [
          "HR-901\tAlpha\tPeople Ops\tStaff\tY\t901\tAppend row one",
          "HR-902\tBeta\tRewards\tLead\tN\t902\tAppend row two",
        ].join("\n"),
      );
    await page.getByTestId("paste-apply").click();

    await expect(page.getByTestId("paste-summary-matrix")).toContainText("2 x 7");
    await expect(page.getByTestId("paste-summary-policy")).toContainText("append");
    await expect(page.getByTestId("paste-summary-appended")).toContainText(
      "appended rows: 1",
    );
    await expect(page.getByTestId("paste-summary-row-overflow")).toContainText(
      "row overflow cells: 0",
    );
    await expect(page.getByTestId("paste-summary-skipped-total")).toContainText(
      "skipped total: 1",
    );
    await expect(page.getByTestId("paste-summary-skipped-readonly")).toContainText("1");
    await expect(page.getByTestId("paste-summary-first-skipped")).toContainText(
      "readonly",
    );
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

  test("keeps filter input focus after Enter applies a text filter", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    const filterInput = page.getByTestId("filter-input-sampleCode");
    await filterInput.click();
    await filterInput.fill("HR-012");
    await filterInput.press("Enter");

    await expect(page.getByTestId("query-preview")).toContainText('"field": "sampleCode"');
    await expect(page.getByTestId("query-preview")).toContainText('"value": "HR-012"');
    await expect(filterInput).toHaveValue("HR-012");
    await expect(filterInput).toBeFocused();
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

    await expect(page.getByTestId("paste-summary-validation")).toContainText(
      "validation errors: 1",
    );
    await expect(page.getByTestId("paste-summary-first-validation")).toContainText(
      "sortOrder",
    );
    await expect(page.getByTestId("paste-summary-skipped-validation")).toContainText("1");
    await expect(page.getByTestId("paste-summary")).toContainText("sortOrder");
    await expect(page.getByTestId("grid-cell-HR-001-sortOrder")).toHaveText("1");
  });

  test("moves the active cell with arrow keys without creating a range", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("grid-cell-HR-001-sampleCode").click();
    await page.keyboard.press("ArrowRight");

    await expect(page.getByTestId("vibe-grid")).toHaveAttribute("data-range-rows", "0");
    await expect(page.getByTestId("grid-cell-HR-001-sampleName")).toHaveAttribute(
      "data-active-cell",
      "true",
    );
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

  test("keeps the original anchor while Shift-click range selection continues", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("grid-cell-HR-001-sampleCode").click();
    await page.keyboard.down("Shift");
    await page.getByTestId("grid-cell-HR-002-sampleName").click();

    await expect(page.getByTestId("vibe-grid")).toHaveAttribute(
      "data-range-anchor",
      "sampleCode",
    );
    await expect(page.getByTestId("vibe-grid")).toHaveAttribute("data-range-rows", "2");
    await expect(page.getByTestId("vibe-grid")).toHaveAttribute(
      "data-range-columns",
      "2",
    );

    await page.getByTestId("grid-cell-HR-003-department").click();
    await page.keyboard.up("Shift");

    await expect(page.getByTestId("vibe-grid")).toHaveAttribute(
      "data-range-anchor",
      "sampleCode",
    );
    await expect(page.getByTestId("vibe-grid")).toHaveAttribute("data-range-rows", "3");
    await expect(page.getByTestId("vibe-grid")).toHaveAttribute(
      "data-range-columns",
      "3",
    );
    await expect(page.getByTestId("range-summary")).toContainText("3 x 3");
  });

  test("supports direct in-grid paste from the current anchor cell", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("grid-cell-HR-001-sampleName").click();
    await page.evaluate((text) => {
      const grid = document.querySelector('[data-testid="vibe-grid"]');

      if (!(grid instanceof HTMLElement)) {
        throw new Error("Grid root was not found.");
      }

      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", {
        value: {
          getData: (type: string) => (type === "text/plain" ? text : ""),
        },
      });
      grid.dispatchEvent(event);
    }, ["Alpha", "People Ops", "Lead"].join("\t"));

    await expect(page.getByTestId("paste-summary-source")).toContainText(
      "그리드 직접 붙여넣기",
    );
    await expect(page.getByTestId("paste-summary-matrix")).toContainText("1 x 3");
    await expect(page.getByTestId("paste-summary-applied")).toContainText("applied: 3");
    await expect(page.getByTestId("grid-cell-HR-001-sampleName")).toHaveText("Alpha");
    await expect(page.getByTestId("grid-cell-HR-001-department")).toHaveText(
      "People Ops",
    );
    await expect(page.getByTestId("grid-cell-HR-001-jobTitle")).toHaveText("Lead");
  });

  test("emits experimental public events for paste, copy, and save", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("grid-cell-HR-001-sampleName").click();
    await page.evaluate((text) => {
      const grid = document.querySelector('[data-testid="vibe-grid"]');

      if (!(grid instanceof HTMLElement)) {
        throw new Error("Grid root was not found.");
      }

      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", {
        value: {
          getData: (type: string) => (type === "text/plain" ? text : ""),
        },
      });
      grid.dispatchEvent(event);
    }, "Event Alpha");

    await expect(page.getByTestId("public-event-log-item-0")).toContainText("onAfterPaste");
    await expect(page.getByTestId("public-event-log-item-1")).toContainText("onBeforePaste");

    await page.getByTestId("command-copyRow").click();
    await expect(page.getByTestId("public-event-log-item-0")).toContainText("onAfterRowCopy");

    await page.getByTestId("command-save").click();
    await expect(page.getByTestId("public-event-log-item-0")).toContainText("onAfterSave");
  });

  test("rejects overflow rows when the policy is reject", async ({ page }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("grid-cell-HR-012-sampleCode").click();
    await page.getByTestId("paste-row-overflow-policy").selectOption("reject");
    await page
      .getByTestId("paste-textarea")
      .fill(
        [
          "HR-901\tAlpha\tPeople Ops\tStaff\tY\t901\tOverflow one",
          "HR-902\tBeta\tRewards\tLead\tN\t902\tOverflow two",
        ].join("\n"),
      );
    await page.getByTestId("paste-apply").click();

    await expect(page.getByTestId("paste-summary-policy")).toContainText("reject");
    await expect(page.getByTestId("paste-summary-appended")).toContainText(
      "appended rows: 0",
    );
    await expect(page.getByTestId("paste-summary-row-overflow")).toContainText(
      "row overflow cells: 7",
    );
    await expect(page.getByTestId("paste-summary-skipped-rowOverflow")).toContainText("7");
    await expect(page.getByTestId("paste-summary-first-skipped")).toContainText(
      "rowOverflow",
    );
  });

  test("applies cell-level editability to side editors and paste targets", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    const editableCell = page.getByTestId("grid-cell-HR-001-note");
    const readonlyCell = page.getByTestId("grid-cell-HR-002-note");

    await expect(editableCell).toHaveAttribute("data-cell-editable", "true");
    await expect(readonlyCell).toHaveAttribute("data-cell-editable", "false");

    await page.getByTestId("grid-cell-HR-001-sampleCode").click();
    await expect(page.getByTestId("side-editor-note")).toBeEnabled();

    await page.getByTestId("grid-cell-HR-002-sampleCode").click();
    await expect(page.getByTestId("side-editor-note")).toBeDisabled();

    const readonlyNoteBefore = await readonlyCell.textContent();

    await readonlyCell.click();
    await page.getByTestId("paste-textarea").fill("Readonly note should skip");
    await page.getByTestId("paste-apply").click();

    await expect(page.getByTestId("paste-summary-skipped-readonly")).toContainText("1");
    await expect(page.getByTestId("paste-summary-first-skipped")).toContainText(
      "readonly",
    );
    await expect(readonlyCell).toHaveText((readonlyNoteBefore ?? "").trim());
  });

  test("supports single-click edit activation as an opt-in mode", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("grid-cell-HR-001-sampleCode").click();
    await expect(page.getByTestId("inline-editor-HR-001-sampleCode")).toHaveCount(0);

    await page.getByTestId("edit-activation-mode").selectOption("singleClick");
    await expect(page.getByTestId("vibe-grid")).toHaveAttribute(
      "data-edit-activation",
      "singleClick",
    );

    await page.getByTestId("grid-cell-HR-001-sampleCode").click();
    await expect(page.getByTestId("inline-editor-HR-001-sampleCode")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("inline-editor-HR-001-sampleCode")).toHaveCount(0);

    await page.getByTestId("grid-cell-HR-002-note").click();
    await expect(page.getByTestId("inline-editor-HR-002-note")).toHaveCount(0);
  });

  test("supports the date editor foundation with calendar constraints", async ({
    page,
  }) => {
    await page.goto("/labs/grid");

    await page.getByTestId("grid-cell-HR-001-effectiveDate").dblclick();
    await expect(
      page.getByTestId("inline-editor-HR-001-effectiveDate"),
    ).toBeVisible();

    await page.getByTestId("date-editor-toggle-HR-001-effectiveDate").click();
    await expect(
      page.getByTestId("date-editor-popover-HR-001-effectiveDate"),
    ).toBeVisible();

    await expect(page.getByTestId("date-editor-day-2026-03-07")).toBeDisabled();
    await expect(page.getByTestId("date-editor-day-2026-03-16")).toBeDisabled();
    await page.getByTestId("date-editor-day-2026-03-10").click();

    await expect(
      page.getByTestId("grid-cell-HR-001-effectiveDate"),
    ).toContainText("2026-03-10");

    await page.getByTestId("grid-cell-HR-001-sampleCode").click();
    await expect(page.getByTestId("side-editor-effectiveDate")).toHaveValue(
      "2026-03-10",
    );
  });
});
