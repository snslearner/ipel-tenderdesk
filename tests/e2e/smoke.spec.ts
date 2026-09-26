import { expect, test } from "@playwright/test";

test("home page shows app name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "IPEL TenderDesk" })).toBeVisible();
});
