import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { formatDate, formatINR } from "@/lib/format";
import { dueInfo, poFlags, type PoStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { PoFlags, PoStatusBadge } from "@/components/orders/po-badges";
import { OrderWorkspace } from "@/components/orders/order-workspace";

export const metadata: Metadata = { title: "Order · IPEL TenderDesk" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();

  const [user, poRes, lineRes, discRes, vpoRes, inspRes, dcRes, extRes, invRes] = await Promise.all([
    getSessionUser(),
    supabase.from("v_po_overview").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("v_po_lines")
      .select("client_po_item_id, part_number, product_name, ordered_qty, delivered_qty, pending_qty, unit_price, pending_value")
      .eq("client_po_id", id)
      .order("part_number"),
    supabase
      .from("po_discrepancies")
      .select("id, field, expected, actual, raised_on, amendment_ref, resolved_on, client_po_items(part_number)")
      .eq("client_po_id", id)
      .order("raised_on")
      .order("id"), // stable order: rows raised the same day must not swap on refresh
    supabase
      .from("v_vendor_po_balance")
      .select("vendor_po_id, vendor_name, vendor_type, po_number, po_date, eta, status, po_value, received_value, paid, payable_now, balance_due, eta_after_client_due")
      .eq("client_po_id", id)
      .order("po_date"),
    supabase
      .from("inspections")
      .select("id, agency, called_on, scheduled_on, result, remarks")
      .eq("client_po_id", id)
      .order("called_on", { ascending: false, nullsFirst: false }),
    supabase
      .from("dispatches")
      .select("id, dc_number, dispatched_on, received_on, signed_sealed_stamped, dispatch_items(client_po_item_id, qty)")
      .eq("client_po_id", id)
      .order("dispatched_on"),
    supabase
      .from("extension_requests")
      .select("id, created_on, requested_date, reason, letter_text, status, approval_ref, approved_on")
      .eq("client_po_id", id)
      .order("created_on", { ascending: false }),
    supabase.from("v_invoice_balance").select("*").eq("client_po_id", id).maybeSingle(),
  ]);
  for (const r of [poRes, lineRes, discRes, vpoRes, inspRes, dcRes, extRes, invRes]) {
    if (r.error) throw new Error(`Could not load order: ${r.error.message}`);
  }
  const po = poRes.data;
  if (!po || !po.id || !po.status) notFound();

  const vendorPoIds = (vpoRes.data ?? []).map((v) => v.vendor_po_id).filter((x): x is string => !!x);
  const invoiceId = invRes.data?.invoice_id ?? null;
  const [payRes, rcptRes] = await Promise.all([
    vendorPoIds.length
      ? supabase.from("vendor_payments").select("id, vendor_po_id, paid_on, amount, mode, reference").in("vendor_po_id", vendorPoIds).order("paid_on")
      : Promise.resolve({ data: [], error: null }),
    invoiceId
      ? supabase.from("receipts").select("id, received_on, amount, tds, gst_tds, ld_deducted, other_deductions, reference").eq("invoice_id", invoiceId).order("received_on")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (payRes.error) throw new Error(`Could not load vendor payments: ${payRes.error.message}`);
  if (rcptRes.error) throw new Error(`Could not load receipts: ${rcptRes.error.message}`);

  const status = po.status as PoStatus;
  const due = dueInfo(po.days_to_due, po.pending_qty);

  return (
    <div className="space-y-5">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden">
        <ChevronLeft className="size-4" /> Orders
      </Link>

      <header className="space-y-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight break-all" data-testid="po-number">
            {po.po_number}
          </h1>
          <PoStatusBadge status={status} />
          <PoFlags flags={poFlags({ ...po, status })} />
        </div>
        <p className="text-sm break-words">{po.title}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <Fact label="Client" value={po.client_name ?? "—"} wide />
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Tender</dt>
            <dd className="truncate font-medium">
              <Link href={`/tenders/${po.tender_id}`} className="underline underline-offset-4">
                {po.tender_ref}
              </Link>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Effective due</dt>
            <dd className="font-medium">
              {formatDate(po.effective_due)}
              <span className={cn("block text-xs", due.overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                {po.extended_due_date ? "Extended · " : ""}
                {due.text}
              </span>
            </dd>
          </div>
          <Fact label="Projected delivery" value={formatDate(po.projected_delivery)} />
          <Fact label="PO value" value={formatINR(po.total_value)} />
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">LD exposure</dt>
            <dd className={cn("font-medium tabular-nums", (po.ld_exposure ?? 0) > 0 && "text-destructive")} data-testid="ld-exposure">
              {formatINR(po.ld_exposure)}
            </dd>
          </div>
        </dl>
        {po.delay_clause_text && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs">
            <span className="font-medium">Delay clause:</span> {po.delay_clause_text}
            {(po.weeks_late_projected ?? 0) > 0 && (
              <span className="block text-muted-foreground">
                Projected {po.weeks_late_projected} week(s) late on the latest vendor ETA.
              </span>
            )}
          </p>
        )}
      </header>

      <OrderWorkspace
        po={{
          id: po.id,
          po_number: po.po_number ?? "",
          status,
          pending_qty: po.pending_qty ?? 0,
          effective_due: po.effective_due,
          payment_docs_missing: po.payment_docs_missing ?? [],
          ready_to_claim: !!po.ready_to_claim,
        }}
        role={user.role}
        lines={lineRes.data ?? []}
        discrepancies={(discRes.data ?? []).map((d) => ({ ...d, part_number: d.client_po_items?.part_number ?? null }))}
        vendorPos={vpoRes.data ?? []}
        vendorPayments={payRes.data ?? []}
        inspections={inspRes.data ?? []}
        dispatches={dcRes.data ?? []}
        extensions={extRes.data ?? []}
        invoice={invRes.data}
        receipts={rcptRes.data ?? []}
      />
    </div>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 min-w-0 sm:col-span-1" : "min-w-0"}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
