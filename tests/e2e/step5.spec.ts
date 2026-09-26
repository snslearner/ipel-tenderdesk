import { expect, test } from "@playwright/test";
import { AUTH_FILE, expectNoHorizontalScroll, tenderIdByRef } from "./helpers";

// Read-only smoke tests for the Step 5 screens; they change no data.

test.describe("as tender team", () => {
  test.use({ storageState: AUTH_FILE.tender });

  test("vendors: type filter, then vendor detail", async ({ page }) => {
    await page.goto("/vendors");
    const cards = page.getByTestId("vendor-card");
    await expect(cards.first()).toBeVisible();
    await page.getByRole("button", { name: /^OEM/ }).click();
    await expect(page).toHaveURL(/type=oem/);
    await expect(page.getByTestId("vendor-count")).toContainText("Showing 20 of 45");
    for (const t of await page.getByTestId("vendor-type").allTextContents()) expect(t).toBe("OEM");
    await expectNoHorizontalScroll(page);

    await cards.first().click();
    await expect(page.getByTestId("vendor-name")).toBeVisible();
    await expect(page.getByTestId("vendor-certificates")).toBeVisible();
    await expect(page.getByTestId("vendor-prices")).toBeVisible();
    await expect(page.getByTestId("vendor-pos")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("clients: list, then client with tenders and orders", async ({ page }) => {
    await page.goto("/clients");
    await expect(page.getByTestId("client-card")).toHaveCount(5);
    await page.getByTestId("client-card").first().click();
    await expect(page.getByTestId("client-name")).toBeVisible();
    await expect(page.getByTestId("client-orders").getByRole("heading")).toContainText("Orders");
    await expect(page.getByTestId("client-tenders").getByRole("heading")).toContainText("Tenders");
    await expectNoHorizontalScroll(page);
  });

  test("products: search by part number, then price and bid history", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("searchbox", { name: "Search products" }).fill("IP-0079-A");
    const cards = page.getByTestId("product-card");
    await expect(cards).toHaveCount(1);
    await cards.first().click();
    await expect(page.getByTestId("product-part")).toHaveText("IP-0079-A");
    await expect(page.getByTestId("product-prices")).toBeVisible();
    await expect(page.getByTestId("product-history").getByRole("link").first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("AI checklist tab: demo PDFs and a clear message when AI is not configured", async ({ page }) => {
    await page.goto(`/tenders/${await tenderIdByRef("TND-2026-151")}`);
    await page.getByRole("tab", { name: "AI checklist" }).click();
    const tab = page.getByTestId("ai-checklist");
    for (const name of ["Demo tender, 5 lines", "Demo tender, 40 lines"]) {
      const href = await tab.getByRole("link", { name }).getAttribute("href");
      const res = await page.request.get(href!);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("application/pdf");
    }
    const status = await (await page.request.get("/api/ai/tender-checklist")).json();
    if (status.configured) {
      await expect(tab.getByLabel("Tender PDF")).toBeEnabled();
    } else {
      await expect(page.getByTestId("ai-not-configured")).toContainText("ANTHROPIC_API_KEY");
      await expect(tab.getByRole("button", { name: /Upload and analyse/ })).toBeDisabled();
    }
    await expectNoHorizontalScroll(page);
  });
});

test.describe("as accounts", () => {
  test.use({ storageState: AUTH_FILE.accounts });

  test("reminders: grouped by role, Mine filters to the signed-in role", async ({ page }) => {
    await page.goto("/reminders");
    await expect(page.getByTestId("reminder-group").first()).toBeVisible();
    await page.getByRole("button", { name: /^Mine \(Accounts\)/ }).click();
    await expect(page).toHaveURL(/mine=1/);
    const groups = page.getByTestId("reminder-group");
    await expect(groups).toHaveCount(1);
    await expect(groups.first().getByRole("heading")).toContainText("Accounts");
    await expect(page.getByTestId("new-reminder")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});

test.describe("as owner", () => {
  test.use({ storageState: AUTH_FILE.owner });

  test("dashboard pipeline caption shows open, unpriced and awaiting counts", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("kpi-pipeline")).toContainText(/\d+ open \(\d+ not yet priced\) · \d+ awaiting approval/);
  });
});
