import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, loginAs, resetOwnerReview, tenderIdByRef } from "./helpers";

// Seeded tenders in owner_review. Desktop and mobile run in parallel, so each project
// approves its own tender to avoid racing on shared data.
const APPROVE_REF = { desktop: "TND-2026-155", mobile: "TND-2026-154" } as const;

test("dashboard shows KPIs from v_dashboard_kpis", async ({ page }) => {
  await loginAs(page, /Ram Prasad/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await expect(page.getByTestId("kpi-win-rate")).toContainText(/\d+(\.\d)?%/);
  for (const id of ["kpi-pipeline", "kpi-order-book", "kpi-ld", "kpi-payables", "kpi-guarantees"]) {
    await expect(page.getByTestId(id)).toContainText("₹");
  }
  for (const id of ["kpi-due-45", "kpi-overdue", "kpi-locked", "kpi-extensions", "kpi-ready-to-claim", "kpi-certificates"]) {
    await expect(page.getByTestId(id).locator('[data-slot="kpi-value"]')).toHaveText(/^\d[\d,]*$/);
  }
  const receivables = page.getByTestId("kpi-receivables");
  await expect(receivables).toContainText("₹");
  await expect(receivables.locator(".recharts-bar-rectangle")).toHaveCount(4);

  await expect(page.getByTestId("kpi-pipeline")).toHaveAttribute("href", "/tenders?status=open");
  await expect(page.getByTestId("needs-you-today").getByRole("heading", { name: "Needs you today" })).toBeVisible();
  await expect(page.getByTestId("needs-you-today").locator("li").first()).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("tender filter works: status chip, search and client", async ({ page }) => {
  await loginAs(page, /Anita Kulkarni/);
  await page.goto("/tenders");
  const rows = page.locator('[data-testid="tender-row"]:visible, [data-testid="tender-card"]:visible');
  const count = page.getByTestId("tender-count");
  await expect(count).toContainText(/Showing (\d+) of \1$/);
  const total = Number((await count.textContent())!.match(/of (\d+)/)![1]);

  await page.getByRole("button", { name: /^Owner review/ }).click();
  await expect(page).toHaveURL(/status=owner_review/);
  await expect(count).toHaveText(`Showing 2 of ${total}`);
  await expect(rows).toHaveCount(2);
  for (const s of await rows.getByTestId("tender-status").allTextContents()) expect(s).toBe("Owner review");

  await page.getByRole("searchbox", { name: "Search tenders" }).fill("TND-2026-155");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("TND-2026-155");

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(count).toHaveText(`Showing ${total} of ${total}`);

  await page.getByRole("combobox", { name: "Filter by client" }).selectOption({ label: "Sahyadri Avionics Ltd" });
  await expect(rows.first()).toBeVisible();
  const clientRows = await rows.count();
  expect(clientRows).toBeGreaterThan(0);
  expect(clientRows).toBeLessThan(total);
  await expectNoHorizontalScroll(page);
});

test("non-owner does not see Approve on a bid in owner review", async ({ page }) => {
  const id = await tenderIdByRef("TND-2026-154");
  await loginAs(page, /Anita Kulkarni/);
  await page.goto(`/tenders/${id}`);
  await expect(page.getByTestId("tender-ref")).toHaveText("TND-2026-154");
  await expect(page.getByTestId("tender-status").first()).toHaveText("Owner review");
  await expect(page.getByTestId("tender-item").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Return to team" })).toHaveCount(0);
  await expectNoHorizontalScroll(page);
});

test.describe("owner approval", () => {
  test("owner approves a tender in owner_review", async ({ page }, testInfo) => {
    const ref = APPROVE_REF[testInfo.project.name as keyof typeof APPROVE_REF];
    await resetOwnerReview(ref);
    try {
      const id = await tenderIdByRef(ref);
      await loginAs(page, /Ram Prasad/);
      await page.goto(`/tenders/${id}`);
      await expect(page.getByTestId("tender-ref")).toHaveText(ref);

      await page.getByRole("button", { name: "Approve" }).click();
      await expect(page.getByText("Approve: done")).toBeVisible();
      await expect(page.getByTestId("approved-note")).toContainText("Approved by owner");
      await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
      await expectNoHorizontalScroll(page);
    } finally {
      await resetOwnerReview(ref);
    }
  });
});
