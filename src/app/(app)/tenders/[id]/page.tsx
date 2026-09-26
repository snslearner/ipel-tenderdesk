import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { formatDate, formatINR, formatPct } from "@/lib/format";
import { StatusBadge } from "@/components/tenders/status-badge";
import { TenderActions } from "@/components/tenders/tender-actions";
import { TenderWorkspace } from "@/components/tenders/tender-workspace";

export const metadata: Metadata = { title: "Tender · IPEL TenderDesk" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TenderPage({ params }: PageProps<"/tenders/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [user, sumRes, tenderRes, itemRes, checkRes, bgRes, vendorRes] = await Promise.all([
    getSessionUser(),
    supabase.from("v_tender_summary").select("*").eq("id", id).maybeSingle(),
    supabase.from("tenders").select("owner_comment").eq("id", id).maybeSingle(),
    supabase
      .from("tender_items")
      .select("id, line_no, description, qty, uom, vendor_id, unit_cost, unit_bid_price, products(part_number, name)")
      .eq("tender_id", id)
      .order("line_no"),
    supabase
      .from("tender_checklist_items")
      .select("id, kind, text, done, source")
      .eq("tender_id", id)
      .order("created_at"),
    supabase
      .from("bank_guarantees")
      .select("id, kind, bank_name, bg_number, amount, issued_on, valid_until, status")
      .eq("tender_id", id)
      .order("issued_on"),
    supabase.from("vendors").select("id, name, type").order("name"),
  ]);
  for (const r of [sumRes, tenderRes, itemRes, checkRes, bgRes, vendorRes]) {
    if (r.error) throw new Error(`Could not load tender: ${r.error.message}`);
  }
  const t = sumRes.data;
  if (!t || !t.id || !t.status) notFound();

  const items = (itemRes.data ?? []).map((i) => ({
    id: i.id,
    line_no: i.line_no,
    description: i.description,
    qty: i.qty,
    uom: i.uom,
    vendor_id: i.vendor_id,
    unit_cost: i.unit_cost,
    unit_bid_price: i.unit_bid_price,
    part_number: i.products?.part_number ?? null,
    product_name: i.products?.name ?? null,
  }));

  const parts = [...new Set(items.map((i) => i.part_number).filter((p): p is string => !!p))];
  const histRes = parts.length
    ? await supabase
        .from("v_part_history")
        .select("part_number, tender_id, ref_no, tender_status, published_on, client_name, qty, unit_cost, unit_bid_price, vendor_name")
        .in("part_number", parts)
        .neq("tender_id", id)
        .order("published_on", { ascending: false })
    : { data: [], error: null };
  if (histRes.error) throw new Error(`Could not load part history: ${histRes.error.message}`);

  const approved = !!t.approved_at;

  return (
    <div className="space-y-5">
      <Link href="/tenders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Tenders
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight" data-testid="tender-ref">
            {t.ref_no}
          </h1>
          <StatusBadge status={t.status} />
          {approved && t.status === "owner_review" && (
            <span data-testid="approved-note" className="text-xs font-medium text-emerald-700">
              Approved by owner on {formatDate(t.approved_at)}
            </span>
          )}
        </div>
        <p className="text-sm break-words">{t.title}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <Fact label="Client" value={t.client_name ?? "—"} wide />
          <Fact label="Submission due" value={formatDate(t.submission_due)} />
          <Fact label="Bid value" value={formatINR(t.total_bid)} />
          <Fact label="Cost" value={formatINR(t.total_cost)} />
          <Fact label="Margin" value={formatPct(t.margin_pct)} />
          <Fact
            label="Open items"
            value={`${t.lines_incomplete ?? 0} lines · ${t.open_submission_checks ?? 0} checks`}
          />
        </dl>
        {tenderRes.data?.owner_comment && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="font-medium">Owner comment:</span> {tenderRes.data.owner_comment}
          </p>
        )}
        {t.status === "lost" && t.loss_reason && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="font-medium">Loss reason:</span> {t.loss_reason}
          </p>
        )}
        <TenderActions tenderId={t.id} status={t.status} approved={approved} role={user.role} />
      </header>

      <TenderWorkspace
        tenderId={t.id}
        userId={user.id}
        status={t.status}
        items={items}
        checklist={checkRes.data ?? []}
        guarantees={bgRes.data ?? []}
        vendors={vendorRes.data ?? []}
        history={histRes.data ?? []}
      />
    </div>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 min-w-0 sm:col-span-1 lg:col-span-1" : "min-w-0"}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
