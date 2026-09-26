import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINRCompact, formatPct, todayIST } from "@/lib/format";
import { roleLabel } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AgeingChart } from "@/components/dashboard/ageing-chart";

export const metadata: Metadata = { title: "Dashboard · IPEL TenderDesk" };

const count = (n: number | null) => (n ?? 0).toLocaleString("en-IN");

export default async function DashboardPage() {
  const supabase = await createClient();

  // Idempotent: creates extension-letter drafts and reminders that are due. Never blocks the page.
  const refresh = await supabase.rpc("fn_refresh_alerts");

  const today = todayIST();
  const [kpiRes, remRes] = await Promise.all([
    supabase.from("v_dashboard_kpis").select("*").single(),
    supabase
      .from("reminders")
      .select("id, kind, text, due_on, assignee_role, channel")
      .eq("status", "open")
      .lte("due_on", today)
      .order("due_on", { ascending: true })
      .limit(50),
  ]);
  if (kpiRes.error) throw new Error(`Could not load dashboard figures: ${kpiRes.error.message}`);
  if (remRes.error) throw new Error(`Could not load reminders: ${remRes.error.message}`);
  const k = kpiRes.data;
  const reminders = remRes.data;

  const ageing = [
    { bucket: "0–30", amount: k.ar_0_30 ?? 0 },
    { bucket: "31–60", amount: k.ar_31_60 ?? 0 },
    { bucket: "61–90", amount: k.ar_61_90 ?? 0 },
    { bucket: "90+", amount: k.ar_90_plus ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <span className="text-xs text-muted-foreground">FY from {formatDate(k.fy_start)}</span>
      </div>
      {refresh.error && (
        <p role="status" className="text-sm text-destructive">
          Alerts could not be refreshed: {refresh.error.message}
        </p>
      )}

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
          sub={`${count(k.open_tenders)} open · ${count(k.awaiting_owner_approval)} awaiting approval`}
          href="/tenders?status=open"
        />
        <KpiCard
          testId="kpi-order-book"
          label="Order book"
          value={formatINRCompact(k.order_book_value)}
          sub={`${count(k.active_orders)} active orders`}
          href="/orders"
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
            <Link href="/orders?view=receivables" className="shrink-0 text-xs font-medium underline underline-offset-4">
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
          sub="Open vendor PO balance"
          href="/orders?view=payables"
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

      <section aria-labelledby="needs-you" className="space-y-3" data-testid="needs-you-today">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="needs-you" className="text-base font-semibold">
            Needs you today
          </h2>
          <Link href="/reminders" className="text-xs font-medium underline underline-offset-4">
            All reminders
          </Link>
        </div>
        {reminders.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nothing due today.
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {reminders.map((r) => {
              const overdue = r.due_on < today;
              return (
                <li key={r.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-start sm:gap-3">
                  <p className="min-w-0 flex-1 text-sm break-words">{r.text}</p>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {overdue ? (
                      <Badge variant="destructive">Overdue · {formatDate(r.due_on)}</Badge>
                    ) : (
                      <Badge variant="outline">Today</Badge>
                    )}
                    {r.assignee_role && <Badge variant="secondary">{roleLabel(r.assignee_role)}</Badge>}
                    <span className="capitalize">{r.channel}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
