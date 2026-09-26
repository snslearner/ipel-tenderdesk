import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/database.types";

export const PASSWORD = "IpelDemo#2026";

// Signs in with the one-tap demo button and waits for the dashboard.
export async function loginAs(page: Page, name: RegExp | string) {
  await page.goto("/");
  await page.getByRole("button", { name }).click();
  await page.waitForURL("**/dashboard");
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

// Node-side Supabase client signed in as a demo user, for test setup/teardown on shared data.
export async function supabaseAs(email: string) {
  const sb = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { error } = await sb.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return sb;
}

export async function tenderIdByRef(ref: string) {
  const sb = await supabaseAs("tender@example.com");
  const { data, error } = await sb.from("tenders").select("id").eq("ref_no", ref).single();
  if (error) throw error;
  return data.id;
}

// Puts a seeded owner_review tender back to its unapproved state (owner-only fields).
export async function resetOwnerReview(ref: string) {
  const owner = await supabaseAs("ram.prasad@example.com");
  const { data, error } = await owner
    .from("tenders")
    .update({ approved_by: null, approved_at: null, owner_comment: null })
    .eq("ref_no", ref)
    .eq("status", "owner_review")
    .select("status, approved_at");
  if (error) throw error;
  if (data.length !== 1) throw new Error(`${ref} is not in owner_review; seed data has drifted`);
}
