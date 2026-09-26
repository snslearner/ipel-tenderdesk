import { test as setup } from "@playwright/test";
import { AUTH_FILE, loginAs } from "./helpers";

// One real UI sign-in per role; feature specs reuse the saved session.
const ROLES = [
  { key: "owner", name: /Ram Prasad/ },
  { key: "tender", name: /Anita Kulkarni/ },
  { key: "accounts", name: /Priya Iyer/ },
] as const;

for (const r of ROLES) {
  setup(`sign in as ${r.key}`, async ({ page }) => {
    await loginAs(page, r.name);
    await page.context().storageState({ path: AUTH_FILE[r.key] });
  });
}
