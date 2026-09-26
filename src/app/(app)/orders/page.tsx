import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { parseOrderFilters, type PoStatus } from "@/lib/orders";
import { OrderRegister, type OrderRow } from "@/components/orders/order-register";

export const metadata: Metadata = { title: "Orders · IPEL TenderDesk" };

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const filters = parseOrderFilters(await searchParams);
  const supabase = await createClient();
  const [poRes, invRes, vpoRes] = await Promise.all([
    supabase
      .from("v_po_overview")
      .select(
        "id, po_number, client_name, tender_ref, status, effective_due, days_to_due, pending_qty, pending_value, ld_exposure, extension_due, vendor_eta_late, ready_to_claim, open_discrepancies",
      )
      .order("effective_due", { ascending: true }),
    supabase.from("v_invoice_balance").select("client_po_id, received, balance_due"),
    supabase.from("v_vendor_po_balance").select("client_po_id, payable_now"),
  ]);
  for (const r of [poRes, invRes, vpoRes]) {
    if (r.error) throw new Error(`Could not load orders: ${r.error.message}`);
  }

  const invoiceByPo = new Map(invRes.data!.map((i) => [i.client_po_id, i]));
  const payableByPo = new Map<string, number>();
  for (const v of vpoRes.data!) {
    if (v.client_po_id) payableByPo.set(v.client_po_id, (payableByPo.get(v.client_po_id) ?? 0) + (v.payable_now ?? 0));
  }

  const rows: OrderRow[] = poRes.data!.map((p) => {
    const inv = invoiceByPo.get(p.id);
    return {
      id: p.id!,
      po_number: p.po_number ?? "",
      client_name: p.client_name ?? "",
      tender_ref: p.tender_ref ?? "",
      status: p.status as PoStatus,
      effective_due: p.effective_due,
      days_to_due: p.days_to_due,
      pending_qty: p.pending_qty,
      pending_value: p.pending_value,
      ld_exposure: p.ld_exposure,
      extension_due: p.extension_due,
      vendor_eta_late: p.vendor_eta_late,
      ready_to_claim: p.ready_to_claim,
      open_discrepancies: p.open_discrepancies,
      invoice_received: inv ? (inv.received ?? 0) : null,
      balance_due: inv ? inv.balance_due : null,
      payable_now: payableByPo.get(p.id!) ?? 0,
    };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
      <OrderRegister rows={rows} initialFilters={filters} />
    </div>
  );
}
