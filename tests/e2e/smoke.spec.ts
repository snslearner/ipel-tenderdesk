import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "IpelDemo#2026";
const SIGN_IN_URL = /^https?:\/\/[^/]+\/$/;

async function login(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

function currentUser(page: Page) {
  return page.getByTestId("current-user").filter({ visible: true }).first();
}

async function expectSignedInAs(page: Page, name: string, role: string) {
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(currentUser(page)).toContainText(name);
  await expect(currentUser(page).getByTestId("current-role")).toHaveText(role);
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test("signed-out visitor opening an app page is sent to the sign-in page at /", async ({ page }) => {
  for (const path of ["/dashboard", "/orders", "/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(SIGN_IN_URL);
  }
  await expect(page.getByRole("heading", { name: "IPEL TenderDesk" })).toBeVisible();
  await expect(page.getByTestId("signed-in-banner")).toHaveCount(0);
  await expect(page.getByText("Demo only: all data is fictitious.")).toBeVisible();
});

test("wrong password shows the Supabase error", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("tender@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("login-error")).toContainText(/invalid/i);
});

test("tapping a demo user signs in immediately and lands on /dashboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Ram Prasad/ }).click();
  await page.waitForURL("**/dashboard");
  await expectSignedInAs(page, "Ram Prasad", "Owner");
});

test("/ still shows sign-in when signed in, with a Continue banner", async ({ page }) => {
  await login(page, "tender@example.com");
  await page.goto("/");
  await expect(page).toHaveURL(SIGN_IN_URL);
  const banner = page.getByTestId("signed-in-banner");
  await expect(banner).toHaveText("Signed in as Anita Kulkarni (Tender) – Continue");
  await expect(page.getByRole("button", { name: /Ram Prasad/ })).toBeVisible();
  await banner.getByRole("link", { name: "Continue" }).click();
  await expectSignedInAs(page, "Anita Kulkarni", "Tender");
});

test("Switch user returns to / and a demo tap replaces the current user", async ({ page }) => {
  await login(page, "tender@example.com");
  await page.getByRole("link", { name: "Switch user" }).click();
  await expect(page).toHaveURL(SIGN_IN_URL);
  await expect(page.getByTestId("signed-in-banner")).toContainText("Anita Kulkarni (Tender)");
  await page.getByRole("button", { name: /Priya Iyer/ }).click();
  await page.waitForURL("**/dashboard");
  await expectSignedInAs(page, "Priya Iyer", "Accounts");
  await page.goto("/");
  await expect(page.getByTestId("signed-in-banner")).toContainText("Priya Iyer (Accounts)");
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
    await expectSignedInAs(page, u.name, u.role);
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
  await nav.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("sign out returns to / with no session", async ({ page }, testInfo) => {
  await login(page, "accounts@example.com");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "More" }).click();
  }
  await page.getByRole("button", { name: "Sign out" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(SIGN_IN_URL);
  await expect(page.getByTestId("signed-in-banner")).toHaveCount(0);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(SIGN_IN_URL);
});
