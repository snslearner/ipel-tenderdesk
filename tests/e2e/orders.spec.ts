import { expect, test, type Page } from "@playwright/test";
import { AUTH_FILE, expectNoHorizontalScroll, poIdByNumber, resetLockedPo } from "./helpers";

// Desktop and mobile run in parallel; each project uses its own seeded locked PO
// so the release test never races the other project.
const LOCKED_PO = { desktop: "PO/DMSP/2026/1020", mobile: "PO/NSPW/2026/1021" } as const;
const lockedPo = (project: string) => LOCKED_PO[project as keyof typeof LOCKED_PO];

async function openTab(page: Page, name: string) {
  await page.getByRole("tab", { name: new RegExp(`^${name}`) }).click();
}

test.describe.serial("locked PO", () => {
  test.describe("as tender team", () => {
    test.use({ storageState: AUTH_FILE.tender });
    test("locked PO blocks dispatch and shows the discrepancy", async ({ page }, info) => {
      const po = lockedPo(info.project.name);
      await resetLockedPo(po);
      await page.goto(`/orders/${await poIdByNumber(po)}`);
      await expect(page.getByTestId("po-number")).toHaveText(po);
      await expect(page.getByTestId("po-status")).toHaveText("Locked");

      await openTab(page, "Discrepancies");
      const disc = page.getByTestId("discrepancy");
      await expect(disc.first()).toBeVisible();
      await expect(disc.first().getByTestId("disc-expected")).not.toHaveText("—");
      await expect(disc.first().getByTestId("disc-actual")).not.toHaveText("—");
      await expect(page.getByRole("button", { name: "Release lock" })).toHaveCount(0);

      await openTab(page, "Dispatches");
      const form = page.getByTestId("new-dispatch");
      await form.getByLabel("Delivery challan no.").fill("E2E-DC-BLOCKED");
      await form
        .getByLabel(/^Dispatch qty for/)
        .first()
        .fill("1");
      await form.getByRole("button", { name: "Record dispatch" }).click();
      await expect(page.getByText("Dispatch not allowed: PO status is locked")).toBeVisible();
      await expect(page.getByText("No delivery challans yet.")).toBeVisible();
      await expectNoHorizontalScroll(page);
    });
  });

  test.describe("as owner", () => {
    test.use({ storageState: AUTH_FILE.owner });
    test("owner enters amendment ref, releases the lock and acknowledges", async ({ page }, info) => {
      const po = lockedPo(info.project.name);
      await resetLockedPo(po);
      try {
        await page.goto(`/orders/${await poIdByNumber(po)}`);
        await openTab(page, "Discrepancies");

        // Database refuses release while a discrepancy has no amendment reference.
        await page.getByRole("button", { name: "Release lock" }).click();
        await expect(page.getByText(/no amendment reference yet/)).toBeVisible();

        const items = page.getByTestId("discrepancy");
        const n = await items.count();
        for (let i = 0; i < n; i++) {
          const item = items.nth(i);
          await item.getByLabel("Amendment reference").fill(`E2E-AMD-${i + 1}`);
          await item.getByRole("button", { name: "Save reference" }).click();
          await expect(item.getByTestId("saved-ref")).toHaveText(`Amendment on file: E2E-AMD-${i + 1}`);
        }

        await page.getByRole("button", { name: "Release lock" }).click();
        await expect(page.getByText("Lock released")).toBeVisible();
        await expect(page.getByTestId("po-status")).toHaveText("Received");
        await page.getByRole("button", { name: "Acknowledge PO" }).click();
        await expect(page.getByTestId("po-status")).toHaveText("Acknowledged");
        await expect(page.getByTestId("discrepancy").first()).toContainText("Resolved");
      } finally {
        await resetLockedPo(po);
      }
    });
  });
});

test.describe("as tender team", () => {
  test.use({ storageState: AUTH_FILE.tender });
  test("extension letter for PO/NSPW/2026/1011 is visible and printable", async ({ page }) => {
    await page.goto(`/orders/${await poIdByNumber("PO/NSPW/2026/1011")}`);
    await openTab(page, "Extension");
    const letter = page.getByTestId("letter-text").first();
    await expect(letter).toContainText("Request for extension of delivery period");
    await expect(letter).toContainText("PO/NSPW/2026/1011");

    await page.getByRole("link", { name: "Print view" }).first().click();
    const printed = page.getByTestId("print-letter");
    await expect(printed).toContainText("PO/NSPW/2026/1011");
    await page.evaluate(() => {
      (window as unknown as { printCalls: number }).printCalls = 0;
      window.print = () => {
        (window as unknown as { printCalls: number }).printCalls++;
      };
    });
    await page.getByRole("button", { name: "Print" }).click();
    expect(await page.evaluate(() => (window as unknown as { printCalls: number }).printCalls)).toBe(1);

    // In print media only the letter shows: no app header, nav or controls.
    await page.emulateMedia({ media: "print" });
    await expect(printed).toBeVisible();
    await expect(page.getByRole("button", { name: "Print" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Switch user" })).toBeHidden();
    await page.emulateMedia({ media: "screen" });
    await expectNoHorizontalScroll(page);
  });
});

test.describe("as accounts", () => {
  test.use({ storageState: AUTH_FILE.accounts });
  test("PO/ADS/2025/1003 shows Ready to claim with every document on file", async ({ page }) => {
    await page.goto(`/orders/${await poIdByNumber("PO/ADS/2025/1003")}`);
    await openTab(page, "Invoice");
    const checklist = page.getByTestId("payment-checklist");
    await expect(checklist.getByTestId("ready-to-claim")).toHaveText("Ready to claim");
    await expect(checklist.getByLabel("On file")).toHaveCount(4);
    await expect(checklist.getByLabel("Missing")).toHaveCount(0);
    await expect(page.getByTestId("invoice-balance")).toContainText("Balance due");
    await expectNoHorizontalScroll(page);
  });

  test("orders list: status chip and search", async ({ page }) => {
    await page.goto("/orders");
    const rows = page.locator('[data-testid="order-row"]:visible, [data-testid="order-card"]:visible');
    await page.getByRole("button", { name: /^Closed/ }).click();
    await expect(page).toHaveURL(/status=closed/);
    await expect(rows.first()).toBeVisible();
    for (const s of await rows.getByTestId("po-status").allTextContents()) expect(s).toBe("Closed");

    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByRole("searchbox", { name: "Search orders" }).fill("1003");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("PO/ADS/2025/1003");
    await expect(rows.first()).toContainText("Ready to claim");
    await expectNoHorizontalScroll(page);
  });

  // Dashboard numbers and the lists they link to come from the same view conditions.
  // (Locked is left out: the release test above changes it while running in parallel.)
});

test.describe("as owner", () => {
  test.use({ storageState: AUTH_FILE.owner });
  test("dashboard counts match the order lists they link to", async ({ page }) => {
    for (const id of ["kpi-due-45", "kpi-overdue", "kpi-extensions", "kpi-ready-to-claim"]) {
      await page.goto("/dashboard");
      const card = page.getByTestId(id);
      const value = (await card.locator('[data-slot="kpi-value"]').textContent())!.trim();
      await card.click();
      await expect(page.getByTestId("quick-filter")).toBeVisible();
      await expect(page.getByTestId("order-count")).toContainText(`Showing ${value} of`);
    }
  });
});
