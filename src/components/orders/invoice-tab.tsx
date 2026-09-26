"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatINR, formatQty, todayIST } from "@/lib/format";
import { paymentChecklist } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { useDbAction } from "@/components/use-db-action";
import type { InvoiceBalance, PoSummary, ReceiptRow } from "./types";

const num = (s: string) => (s.trim() === "" ? 0 : Number(s));
const bad = (...xs: number[]) => xs.some((x) => Number.isNaN(x) || x < 0);

export function InvoiceTab({ po, invoice, receipts }: { po: PoSummary; invoice: InvoiceBalance | null; receipts: ReceiptRow[] }) {
  return (
    <div className="space-y-5">
      <PaymentChecklist po={po} />
      {invoice?.invoice_id ? (
        <>
          <Balance invoice={invoice} />
          <Receipts receipts={receipts} />
          <NewReceipt invoiceId={invoice.invoice_id} />
        </>
      ) : po.pending_qty > 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground" data-testid="invoice-blocked">
          An invoice can be raised only when the full PO quantity is delivered. {formatQty(po.pending_qty)} units are still
          pending.
        </p>
      ) : (
        <NewInvoice poId={po.id} />
      )}
    </div>
  );
}

function PaymentChecklist({ po }: { po: PoSummary }) {
  const items = paymentChecklist(po.payment_docs_missing);
  return (
    <section className="space-y-2 rounded-xl border bg-card p-3" data-testid="payment-checklist">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Payment claim checklist</h3>
        {po.ready_to_claim ? (
          <Badge className="bg-emerald-600 text-white" data-testid="ready-to-claim">
            Ready to claim
          </Badge>
        ) : (
          <Badge variant="outline">Documents pending</Badge>
        )}
      </div>
      <ul className="space-y-1 text-sm">
        {items.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            {c.done ? (
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-label="On file" />
            ) : (
              <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Missing" />
            )}
            <span className={cn(!c.done && "font-medium")}>
              {c.label}
              {c.note && <span className="block text-xs font-normal text-muted-foreground">{c.note}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Balance({ invoice: i }: { invoice: InvoiceBalance }) {
  const rows: [string, number | null][] = [
    ["Taxable value", i.taxable_value],
    ["GST", i.gst],
    ["Invoice total", i.total],
    ["Received", i.received],
    ["TDS", i.tds],
    ["GST-TDS", i.gst_tds],
    ["LD deducted", i.ld_deducted],
    ["Other deductions", i.other_deductions],
  ];
  return (
    <section className="space-y-3 rounded-xl border bg-card p-3 text-sm" data-testid="invoice-balance">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium break-all">Invoice {i.invoice_no}</h3>
        <span className="text-xs text-muted-foreground">
          {formatDate(i.invoice_date)} · {i.age_days} days · bucket {i.age_bucket}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map(([label, v]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="truncate tabular-nums">{formatINR(v)}</dd>
          </div>
        ))}
      </dl>
      <p className="text-base font-semibold">
        Balance due{" "}
        <span className={cn("tabular-nums", (i.balance_due ?? 0) > 0 ? "text-destructive" : "text-emerald-700")} data-testid="balance-due">
          {formatINR(i.balance_due)}
        </span>
      </p>
    </section>
  );
}

function Receipts({ receipts }: { receipts: ReceiptRow[] }) {
  if (receipts.length === 0) return <p className="text-sm text-muted-foreground">No receipts yet.</p>;
  return (
    <ul className="space-y-2" data-testid="receipts">
      {receipts.map((r) => (
        <li key={r.id} className="space-y-1 rounded-xl border bg-card p-3 text-xs">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span className="font-medium">{formatDate(r.received_on)}</span>
            <span className="tabular-nums">{formatINR(r.amount)}</span>
          </div>
          <p className="flex flex-wrap gap-x-3 text-muted-foreground">
            <span>TDS {formatINR(r.tds)}</span>
            <span>GST-TDS {formatINR(r.gst_tds)}</span>
            <span>LD {formatINR(r.ld_deducted)}</span>
            <span>Other {formatINR(r.other_deductions)}</span>
            {r.reference && <span className="break-all">Ref {r.reference}</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Field({ id, label, value, onChange, type = "text" }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        inputMode={type === "text" && id !== "inv-no" && id !== "rc-ref" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function NewInvoice({ poId }: { poId: string }) {
  const { pending, run } = useDbAction();
  const [f, setF] = useState({ no: "", date: todayIST(), taxable: "", gst: "" });
  const taxable = num(f.taxable);
  const gst = num(f.gst);
  const invalid = !f.no.trim() || !f.taxable.trim() || bad(taxable, gst);

  return (
    <form
      className="space-y-3 rounded-xl border p-3"
      data-testid="new-invoice"
      onSubmit={(e) => {
        e.preventDefault();
        run("Invoice created", () =>
          createClient().from("invoices").insert({
            client_po_id: poId,
            invoice_no: f.no.trim(),
            invoice_date: f.date,
            taxable_value: taxable,
            gst,
            total: taxable + gst,
          }),
        );
      }}
    >
      <p className="text-sm font-medium">Create invoice</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="inv-no" label="Invoice no." value={f.no} onChange={(v) => setF({ ...f, no: v })} />
        <Field id="inv-date" label="Invoice date" type="date" value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        <Field id="inv-taxable" label="Taxable value (₹)" value={f.taxable} onChange={(v) => setF({ ...f, taxable: v })} />
        <Field id="inv-gst" label="GST (₹)" value={f.gst} onChange={(v) => setF({ ...f, gst: v })} />
      </div>
      <p className="text-sm">Total {bad(taxable, gst) ? "—" : formatINR(taxable + gst)}</p>
      <Button type="submit" disabled={invalid || pending}>
        Create invoice
      </Button>
    </form>
  );
}

function NewReceipt({ invoiceId }: { invoiceId: string }) {
  const { pending, run } = useDbAction();
  const empty = { date: todayIST(), amount: "", tds: "", gst_tds: "", ld: "", other: "", ref: "" };
  const [f, setF] = useState(empty);
  const vals = [f.amount, f.tds, f.gst_tds, f.ld, f.other].map(num);
  const invalid = !f.amount.trim() || bad(...vals);

  return (
    <form
      className="space-y-3 rounded-xl border p-3"
      data-testid="new-receipt"
      onSubmit={(e) => {
        e.preventDefault();
        const [amount, tds, gst_tds, ld_deducted, other_deductions] = vals;
        run(
          "Receipt recorded",
          () =>
            createClient().from("receipts").insert({
              invoice_id: invoiceId,
              received_on: f.date,
              amount,
              tds,
              gst_tds,
              ld_deducted,
              other_deductions,
              reference: f.ref.trim() || null,
            }),
          () => setF(empty),
        );
      }}
    >
      <p className="text-sm font-medium">Record receipt</p>
      <p className="text-xs text-muted-foreground">Sample deduction rates: TDS 1%, GST-TDS 2% of taxable value.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="rc-date" label="Received on" type="date" value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        <Field id="rc-amount" label="Amount received (₹)" value={f.amount} onChange={(v) => setF({ ...f, amount: v })} />
        <Field id="rc-tds" label="TDS (₹)" value={f.tds} onChange={(v) => setF({ ...f, tds: v })} />
        <Field id="rc-gst-tds" label="GST-TDS (₹)" value={f.gst_tds} onChange={(v) => setF({ ...f, gst_tds: v })} />
        <Field id="rc-ld" label="LD deducted (₹)" value={f.ld} onChange={(v) => setF({ ...f, ld: v })} />
        <Field id="rc-other" label="Other deductions (₹)" value={f.other} onChange={(v) => setF({ ...f, other: v })} />
        <Field id="rc-ref" label="Reference" value={f.ref} onChange={(v) => setF({ ...f, ref: v })} />
      </div>
      <Button type="submit" disabled={invalid || pending}>
        Record receipt
      </Button>
    </form>
  );
}
