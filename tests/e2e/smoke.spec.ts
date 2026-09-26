import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "IpelDemo#2026";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test("signed-out visitor is sent to the login page", async ({ page }) => {
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "IPEL TenderDesk" })).toBeVisible();
});

test("wrong password shows the Supabase error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("tender@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("login-error")).toContainText(/invalid/i);
});

const USERS = [
  { email: "ram.prasad@example.com", name: "Ram Prasad", role: "Owner" },
  { email: "tender@example.com", name: "Anita Kulkarni", role: "Tender" },
  { email: "purchase@example.com", name: "Rakesh Menon", role: "Purchase" },
  { email: "accounts@example.com", name: "Priya Iyer", role: "Accounts" },
  { email: "logistics@example.com", name: "Suresh Yadav", role: "Logistics" },
];

for (const u of USERS) {
  test(`${u.role} logs in and sees name and role`, async ({ page }) => {
    await login(page, u.email);
    const badge = page.getByTestId("current-user").filter({ visible: true }).first();
    await expect(badge).toContainText(u.name);
    await expect(badge.getByTestId("current-role")).toHaveText(u.role);
    await expectNoHorizontalScroll(page);
  });
}

test("desktop shows sidebar, mobile shows bottom bar", async ({ page }, testInfo) => {
  await login(page, "tender@example.com");
  const nav = page.getByRole("navigation", { name: "Main" }).filter({ visible: true });
  await expect(nav).toHaveCount(1);
  if (testInfo.project.name === "mobile") {
    await expect(nav.getByRole("button", { name: "More" })).toBeVisible();
    await nav.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await nav.getByRole("button", { name: "More" }).click();
    await page.getByRole("link", { name: "Vendors" }).click();
    await expect(page).toHaveURL(/\/vendors$/);
  } else {
    await expect(nav.getByRole("link", { name: "Settings" })).toBeVisible();
    await nav.getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/products$/);
  }
});

test("sign out returns to login", async ({ page }, testInfo) => {
  await login(page, "accounts@example.com");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "More" }).click();
  }
  await page.getByRole("button", { name: "Sign out" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});
