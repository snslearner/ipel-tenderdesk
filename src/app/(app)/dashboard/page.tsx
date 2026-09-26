import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshAlertsThrottled } from "@/lib/alerts-refresh";
import { addDaysISO, formatDate, formatINRCompact, formatPct, todayIST } from "@/lib/format";
import { getSessionUser } from "@/lib/auth/session";
import { OPEN_STATUSES, SOURCE_LABEL, followUpChannel } from "@/lib/tenders";
import { FollowUpsPanel, type FollowUp } from "@/components/crm/follow-ups-panel";
import { AddCustomerButton } from "@/components/crm/add-customer-dialog";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AgeingChart } from "@/components/dashboard/ageing-chart";

export const metadata: Metadata = { title: "Dashboard · IPEL TenderDesk" };

const count = (n: number | null) => (n ?? 0).toLocaleString("en-IN");

export default async function DashboardPage() {
  const supabase = await createClient();

  // Alerts (extension drafts + reminders) are refreshed after the page is sent, at most once a
  // minute per server, so dashboard loads never wait on it. New alerts show on the next load.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (accessToken) after(() => refreshAlertsThrottled(accessToken));

  const today = todayIST();
  const [user, kpiRes, remRes, unpricedRes, dueRes, doneRes] = await Promise.all([
    getSessionUser(),
    supabase.from("v_dashboard_kpis").select("*").single(),
    supabase
      .from("reminders")
      .select("id, kind, text, due_on, assignee_role, channel")
      .eq("status", "open")
      .lte("due_on", today)
      .order("due_on", { ascending: true })
      .order("id")
      .limit(100),
    // Open tenders with no bid value yet (no priced lines): they add nothing to the pipeline value.
    supabase
      .from("v_tender_summary")
      .select("id", { count: "exact", head: true })
      .in("status", OPEN_STATUSES)
      .or("total_bid.is.null,total_bid.eq.0"),
    // Bids not yet submitted whose submission is due within 7 days (or already past due).
    supabase
      .from("v_tender_summary")
      .select("id, ref_no, title, client_name, source, submission_due")
      .in("status", ["identified", "evaluation", "preparation", "owner_review"])
      .lte("submission_due", addDaysISO(today, 7))
      .order("submission_due"),
    // Tender follow-ups already marked done today.
    supabase.from("reminders").select("entity_id").eq("kind", "tender_followup").eq("status", "done").eq("due_on", today),
  ]);
  if (kpiRes.error) throw new Error(`Could not load dashboard figures: ${kpiRes.error.message}`);
  if (remRes.error) throw new Error(`Could not load reminders: ${remRes.error.message}`);
  for (const r of [dueRes, doneRes]) if (r.error) throw new Error(`Could not load follow-ups: ${r.error.message}`);
  if (unpricedRes.error) throw new Error(`Could not load tender counts: ${unpricedRes.error.message}`);
  const k = kpiRes.data;

  // Owner sees everyone's reminders; other roles see their own and unassigned ones.
  const doneToday = new Set(doneRes.data!.map((d) => d.entity_id));
  const followUps: FollowUp[] = [
    ...remRes.data
      .filter((r) => user.role === "owner" || !user.role || r.assignee_role === user.role || r.assignee_role === null)
      .map((r) => ({ kind: "reminder" as const, id: r.id, text: r.text, due: r.due_on, channel: r.channel, role: r.assignee_role })),
    ...dueRes
      .data!.filter((t) => t.id && t.submission_due && !doneToday.has(t.id))
      .map((t) => ({
        kind: "tender" as const,
        id: t.id!,
        ref: t.ref_no ?? "",
        title: t.title ?? "",
        client: t.client_name ?? "",
        due: t.submission_due!,
        channel: followUpChannel(t.source!),
        source: SOURCE_LABEL[t.source!],
      })),
  ].sort((a, b) => a.due.localeCompare(b.due));

  const ageing = [
    { bucket: "0–30", amount: k.ar_0_30 ?? 0 },
    { bucket: "31–60", amount: k.ar_31_60 ?? 0 },
    { bucket: "61–90", amount: k.ar_61_90 ?? 0 },
    { bucket: "90+", amount: k.ar_90_plus ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <span className="text-xs text-muted-foreground">FY from {formatDate(k.fy_start)}</span>
        </div>
        <AddCustomerButton variant="outline" />
      </div>

      <FollowUpsPanel items={followUps} today={today} role={user.role} />

      <section aria-label="Key figures" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          testId="kpi-win-rate"
          label="Win rate this FY"
          value={formatPct(k.win_rate_fy_pct)}
          sub={`${count(k.won_fy)} won · ${count(k.lost_fy)} lost`}
          href="/tenders?status=won,lost"
        />
        <KpiCard
          testId="kpi-pipeline"
          label="Bid pipeline"
          value={formatINRCompact(k.bid_pipeline_value)}
          sub={`${count(k.open_tenders)} open (${count(unpricedRes.count)} not yet priced) · ${count(k.awaiting_owner_approval)} awaiting approval`}
          href="/tenders?status=open"
        />
        <KpiCard
          testId="kpi-order-book"
          label="Order book"
          value={formatINRCompact(k.order_book_value)}
          sub={`${count(k.active_orders)} active orders`}
          href="/orders?filter=active"
        />
        <KpiCard
          testId="kpi-due-45"
          label="Deliveries due in 45 days"
          value={count(k.deliveries_due_45d)}
          sub={`${formatINRCompact(k.deliveries_due_45d_value)} pending`}
          href="/orders?filter=due_45d"
        />
        <KpiCard
          testId="kpi-overdue"
          label="Overdue deliveries"
          value={count(k.deliveries_overdue)}
          tone={(k.deliveries_overdue ?? 0) > 0 ? "alert" : "default"}
          href="/orders?filter=overdue"
        />
        <KpiCard
          testId="kpi-ld"
          label="LD exposure"
          value={formatINRCompact(k.ld_exposure_open)}
          sub="Uses sample LD rates (0.5%/week, cap 10%)"
          tone={(k.ld_exposure_open ?? 0) > 0 ? "alert" : "default"}
          href="/orders?filter=ld"
        />
        <KpiCard
          testId="kpi-locked"
          label="Locked POs"
          value={count(k.locked_pos)}
          sub="Mismatch with bid; owner must release"
          tone={(k.locked_pos ?? 0) > 0 ? "alert" : "default"}
          href="/orders?filter=locked"
        />
        <KpiCard
          testId="kpi-extensions"
          label="Extensions due"
          value={count(k.extensions_due)}
          sub="Sample trigger: 45 days before due"
          href="/orders?filter=extension_due"
        />

        <div
          data-testid="kpi-receivables"
          className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-4 sm:col-span-2"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">Receivables by age (days)</span>
            <Link href="/orders?filter=receivables" className="shrink-0 text-xs font-medium underline underline-offset-4">
              View
            </Link>
          </div>
          <span data-slot="kpi-value" className="text-2xl font-semibold tracking-tight">
            {formatINRCompact(k.receivables_total)}
          </span>
          <AgeingChart data={ageing} />
        </div>

        <KpiCard
          testId="kpi-ready-to-claim"
          label="Ready to claim"
          value={count(k.ready_to_claim)}
          sub="All payment documents on file"
          href="/orders?filter=ready_to_claim"
        />
        <KpiCard
          testId="kpi-payables"
          label="Payables"
          value={formatINRCompact(k.payables_total)}
          sub="Owed for goods received"
          href="/orders?filter=payables"
        />
        <KpiCard
          testId="kpi-guarantees"
          label="Guarantees"
          value={formatINRCompact(k.bg_live_value)}
          sub={`${count(k.bg_expiring_30d)} expiring within 30 days`}
          href="/reminders?kind=bg_expiring"
        />
        <KpiCard
          testId="kpi-certificates"
          label="Certificates expiring"
          value={count(k.certificates_expiring_30d)}
          sub="Within 30 days"
          tone={(k.certificates_expiring_30d ?? 0) > 0 ? "alert" : "default"}
          href="/reminders?kind=cert_expiring"
        />
      </section>

    </div>
  );
}
