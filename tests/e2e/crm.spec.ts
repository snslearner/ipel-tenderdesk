import { expect, test } from "@playwright/test";
import {
  AUTH_FILE,
  createTestReminder,
  createTestTender,
  deleteTestData,
  expectNoHorizontalScroll,
} from "./helpers";
import { addDaysISO, todayIST } from "../../src/lib/format";

// Every record these tests create carries a unique "E2E ..." marker and is deleted afterwards.
const marker = (project: string) => `E2E ${project} ${Date.now().toString(36)}`;

test.describe("as tender team", () => {
  test.use({ storageState: AUTH_FILE.tender });

  test("add a customer from the Clients page", async ({ page }, info) => {
    const m = marker(info.project.name);
    try {
      await page.goto("/clients");
      await page.getByRole("button", { name: "Add customer" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Name").fill(`${m} Traders`);
      await dialog.getByLabel("Type").selectOption("private_mfr");
      await dialog.getByLabel("Contact person").fill("R. Sharma");
      await dialog.getByLabel("Phone").fill("+91 98450 00000");
      await dialog.getByLabel("Email").fill("buyer@example.com");
      await dialog.getByRole("button", { name: "Save customer" }).click();
      await expect(page.getByText(`Customer ${m} Traders added`)).toBeVisible();
      await expect(page.getByTestId("client-card").filter({ hasText: `${m} Traders` })).toBeVisible();
      await expectNoHorizontalScroll(page);
    } finally {
      await deleteTestData(m);
    }
  });

  test("new enquiry with a new customer, source badge and source filter", async ({ page }, info) => {
    const m = marker(info.project.name);
    try {
      await page.goto("/tenders");
      await page.getByRole("button", { name: "New enquiry" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Customer").selectOption({ label: "+ Add a new customer" });
      await dialog.getByLabel("New customer name").fill(`${m} Lead Co`);
      await dialog.getByLabel("What they need").fill(`${m} 200 seal kits`);
      await dialog.getByLabel("Source").selectOption({ label: "WhatsApp" });
      await dialog.getByLabel("Due date").fill(addDaysISO(todayIST(), 10));
      await dialog.getByRole("button", { name: "Create enquiry" }).click();
      await expect(page.getByText(/^Enquiry ENQ-\d{6}-[0-9A-Z]{4} created$/)).toBeVisible();

      await page.getByRole("searchbox", { name: "Search tenders" }).fill(m);
      const rows = page.locator('[data-testid="tender-row"]:visible, [data-testid="tender-card"]:visible');
      await expect(rows).toHaveCount(1);
      await expect(rows.first().getByTestId("source-badge")).toHaveText("WhatsApp");
      await expect(rows.first().getByTestId("tender-status")).toHaveText("Identified");

      await page.getByRole("searchbox", { name: "Search tenders" }).fill("");
      await page.getByRole("combobox", { name: "Filter by source" }).selectOption({ label: "WhatsApp" });
      await expect(page).toHaveURL(/source=whatsapp/);
      await expect(rows.first()).toBeVisible();
      for (const b of await rows.getByTestId("source-badge").allTextContents()) expect(b).toBe("WhatsApp");
      await expectNoHorizontalScroll(page);
    } finally {
      await deleteTestData(m);
    }
  });

  test("board: move a card to the next stage; database gates show as a toast", async ({ page }, info) => {
    const m = marker(info.project.name);
    const t = await createTestTender(`${m} board card`, addDaysISO(todayIST(), 20));
    try {
      await page.goto(`/tenders?view=board&q=${encodeURIComponent(m)}`);
      const board = page.getByTestId("tender-board");
      const column = (name: string) => board.getByRole("region", { name, exact: true });
      await expect(column("Identified").getByTestId("board-card")).toHaveCount(1);
      await column("Identified").getByRole("button", { name: /Move to next stage/ }).click();
      await expect(page.getByText(`${t.ref_no} moved to Evaluation`)).toBeVisible();
      await expect(column("Evaluation").getByTestId("board-card")).toHaveCount(1);
      await expect(column("Identified").getByTestId("board-card")).toHaveCount(0);

      // TND-2026-151 has unpriced lines: the database refuses Preparation -> Owner review.
      await page.getByRole("searchbox", { name: "Search tenders" }).fill("TND-2026-151");
      await column("Preparation").getByRole("button", { name: /Move to next stage/ }).click();
      await expect(page.locator('[data-sonner-toast][data-type="error"]')).toBeVisible();
      await expect(column("Preparation").getByTestId("board-card")).toHaveCount(1);

      // Seven stage columns; on a phone they scroll inside the board, not the page.
      await expect(board.getByTestId("board-column")).toHaveCount(7);
      await expectNoHorizontalScroll(page);
      if (info.project.name === "mobile") {
        const scrolls = await board.evaluate((el) => el.scrollWidth > el.clientWidth);
        expect(scrolls).toBe(true);
      }
    } finally {
      await deleteTestData(m);
    }
  });
});

test.describe("as owner", () => {
  test.use({ storageState: AUTH_FILE.owner });

  test("follow-ups today sit at the top, with channel icons and Mark done", async ({ page }, info) => {
    const m = marker(info.project.name);
    const today = todayIST();
    await createTestReminder(`${m} visit the buyer`, today);
    const t = await createTestTender(`${m} bid closing soon`, addDaysISO(today, 3), "phone_call");
    try {
      await page.goto("/dashboard");
      const panel = page.getByTestId("follow-ups");
      await expect(panel).toBeVisible();
      await expect(page.getByRole("button", { name: "Add customer" })).toBeVisible();
      // At the top: above the key figures.
      const panelTop = (await panel.boundingBox())!.y;
      const kpiTop = (await page.getByTestId("kpi-win-rate").boundingBox())!.y;
      expect(panelTop).toBeLessThan(kpiTop);

      const showAll = panel.getByRole("button", { name: /^Show all/ });
      if (await showAll.isVisible()) await showAll.click();

      const reminder = panel.getByTestId("follow-up").filter({ hasText: `${m} visit the buyer` });
      await expect(reminder.getByTestId("follow-up-channel")).toHaveAttribute("aria-label", "Visit");
      const bid = panel.getByTestId("follow-up").filter({ hasText: t.ref_no });
      await expect(bid.getByTestId("follow-up-channel")).toHaveAttribute("aria-label", "Call");

      await reminder.getByRole("button", { name: "Mark done" }).click();
      await expect(reminder).toHaveCount(0);
      await bid.getByRole("button", { name: "Mark done" }).click();
      await expect(bid).toHaveCount(0);
      await expectNoHorizontalScroll(page);
    } finally {
      await deleteTestData(m);
    }
  });
});
