import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Tests read Supabase URL/anon key from .env.local to set up and reset shared demo data.
loadEnvConfig(process.cwd());

// Smoke suite runs against the Vercel preview URL when PLAYWRIGHT_BASE_URL is set,
// otherwise against a local production build.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
// Optional: use an installed browser (e.g. PW_CHANNEL=msedge) instead of the bundled Chromium.
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL, channel },
  projects: [
    // Signs in once per role and saves the session, so feature tests don't each hit
    // Supabase Auth's per-IP sign-in rate limit. Login itself is tested in smoke.spec.ts.
    { name: "setup", testMatch: /auth.setup.ts/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
      dependencies: ["setup"],
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: "npm run build && npm run start", url: baseURL, reuseExistingServer: true, timeout: 180_000 },
});
