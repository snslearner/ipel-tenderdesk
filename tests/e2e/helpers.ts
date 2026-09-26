import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/database.types";

export const PASSWORD = "IpelDemo#2026";

// Saved sessions written by auth.setup.ts (gitignored).
export const AUTH_FILE = {
  owner: "playwright/.auth/owner.json",
  tender: "playwright/.auth/tender.json",
  accounts: "playwright/.auth/accounts.json",
} as const;

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
// Cached per worker so helpers don't each spend one of Supabase Auth's rate-limited sign-ins.
const clients = new Map<string, ReturnType<typeof createClient<Database>>>();

export async function supabaseAs(email: string) {
  const cached = clients.get(email);
  if (cached) return cached;
  const sb = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { error } = await sb.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  clients.set(email, sb);
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

export async function poIdByNumber(poNumber: string) {
  const sb = await supabaseAs("tender@example.com");
  const { data, error } = await sb.from("client_pos").select("id").eq("po_number", poNumber).single();
  if (error) throw error;
  return data.id;
}

// Puts a seeded locked PO back to its seed state: discrepancies open with no amendment
// reference, status locked, not acknowledged. Idempotent; used before and after the release test.
// (The UI never sets 'locked' itself; this is test teardown only.)
export async function resetLockedPo(poNumber: string) {
  const owner = await supabaseAs("ram.prasad@example.com");
  const po = await owner.from("client_pos").select("id, status").eq("po_number", poNumber).single();
  if (po.error) throw po.error;
  const disc = await owner
    .from("po_discrepancies")
    .update({ amendment_ref: null, resolved_on: null })
    .eq("client_po_id", po.data.id)
    .select("id");
  if (disc.error) throw disc.error;
  if (disc.data.length === 0) throw new Error(`${poNumber} has no discrepancies; seed data has drifted`);
  const upd = await owner
    .from("client_pos")
    .update({ status: "locked", acknowledged_by: null, acknowledged_at: null })
    .eq("id", po.data.id)
    .in("status", ["locked", "received", "acknowledged"])
    .select("status");
  if (upd.error) throw upd.error;
  if (upd.data.length !== 1) throw new Error(`${poNumber} moved past acknowledged (${po.data.status}); cannot restore`);
}
