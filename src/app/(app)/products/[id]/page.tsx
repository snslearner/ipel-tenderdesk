import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR, formatPct, formatQty } from "@/lib/format";
import { lineMarginPct } from "@/lib/tenders";
import { EmptyState } from "@/components/list-bits";
import { BackLink, Fact, Section, VENDOR_TYPE_LABEL } from "@/components/masters/bits";
import { StatusBadge } from "@/components/tenders/status-badge";

export const metadata: Metadata = { title: "Product · IPEL TenderDesk" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const [pRes, priceRes, histRes] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("vendor_prices")
      .select("id, unit_price, quoted_on, lead_time_days, vendors(id, name, type)")
      .eq("product_id", id)
      .order("quoted_on", { ascending: false }),
    supabase
      .from("v_part_history")
      .select("tender_id, ref_no, tender_status, published_on, client_name, qty, unit_cost, unit_bid_price, vendor_name")
      .eq("product_id", id)
      .order("published_on", { ascending: false }),
  ]);
  for (const r of [pRes, priceRes, histRes]) if (r.error) throw new Error(`Could not load product: ${r.error.message}`);
  const p = pRes.data;
  if (!p) notFound();

  // Group quotes by vendor, newest first within each vendor.
  const byVendor = new Map<string, { name: string; type: string; quotes: typeof priceRes.data }>();
  for (const q of priceRes.data!) {
    const v = q.vendors;
    if (!v) continue;
    if (!byVendor.has(v.id)) byVendor.set(v.id, { name: v.name, type: VENDOR_TYPE_LABEL[v.type], quotes: [] });
    byVendor.get(v.id)!.quotes!.push(q);
  }
  const history = histRes.data!;
  const won = history.filter((h) => h.tender_status === "won").length;
  const lost = history.filter((h) => h.tender_status === "lost").length;

  return (
    <div className="space-y-6">
      <BackLink href="/products">Products</BackLink>
      <header className="space-y-3">
        <h1 className="text-xl font-semibold tracking-tight" data-testid="product-part">
          {p.part_number}
        </h1>
        <p className="text-sm">{p.name}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm lg:grid-cols-4">
          <Fact label="Standard">{p.standard ?? "—"}</Fact>
          <Fact label="Spec">{p.spec ?? "—"}</Fact>
          <Fact label="Unit">{p.uom}</Fact>
          <Fact label="Past bids">
            {history.length} ({won} won, {lost} lost)
          </Fact>
        </dl>
      </header>

      <Section title="Price history by vendor" testId="product-prices">
        {byVendor.size === 0 ? (
          <EmptyState>No vendor quotes for this part yet.</EmptyState>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {[...byVendor.entries()].map(([vid, v]) => (
              <li key={vid} className="space-y-2 rounded-xl border bg-card p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/vendors/${vid}`} className="min-w-0 font-medium break-words underline-offset-4 hover:underline">
                    {v.name}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">{v.type}</span>
                </div>
                <ul className="space-y-1 text-xs">
                  {v.quotes!.map((q, i) => (
                    <li key={q.id} className="flex flex-wrap justify-between gap-x-3">
                      <span className={i === 0 ? "font-medium" : "text-muted-foreground"}>{formatDate(q.quoted_on)}</span>
                      <span className="tabular-nums">{formatINR(q.unit_price)}</span>
                      <span className="text-muted-foreground">{q.lead_time_days != null ? `${q.lead_time_days} days lead` : "—"}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Past bids for this part" testId="product-history">
        {history.length === 0 ? (
          <EmptyState>This part has not appeared in any tender yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {history.map((h, i) => (
              <li key={`${h.tender_id}-${i}`} className="space-y-1 rounded-xl border bg-card p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/tenders/${h.tender_id}`} className="font-medium underline-offset-4 hover:underline">
                    {h.ref_no}
                  </Link>
                  {h.tender_status && <StatusBadge status={h.tender_status} />}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {h.client_name} · {formatDate(h.published_on)}
                </p>
                <p className="flex flex-wrap gap-x-4 text-xs">
                  <span>Qty {formatQty(h.qty)}</span>
                  <span>Cost {formatINR(h.unit_cost)}</span>
                  <span>Bid {formatINR(h.unit_bid_price)}</span>
                  <span>Margin {formatPct(lineMarginPct(h.unit_cost, h.unit_bid_price))}</span>
                  <span className="min-w-0 truncate">Vendor {h.vendor_name ?? "—"}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
