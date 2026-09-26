import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/list-bits";
import { formatDate, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VendorPaymentRow, VendorPoRow } from "./types";

export function SourcingTab({ vendorPos, payments }: { vendorPos: VendorPoRow[]; payments: VendorPaymentRow[] }) {
  if (vendorPos.length === 0) return <EmptyState>No vendor POs placed for this order yet.</EmptyState>;
  return (
    <ul className="space-y-3" data-testid="vendor-pos">
      {vendorPos.map((v) => {
        const paid = payments.filter((p) => p.vendor_po_id === v.vendor_po_id);
        return (
          <li key={v.vendor_po_id} className="space-y-3 rounded-xl border bg-card p-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium break-all">{v.po_number}</p>
                <p className="truncate text-muted-foreground">
                  {v.vendor_name} <span className="uppercase">· {v.vendor_type}</span>
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {v.status?.replace("_", " ")}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Item label="PO date" value={formatDate(v.po_date)} />
              <div>
                <dt className="text-xs text-muted-foreground">ETA</dt>
                <dd
                  data-testid="vendor-eta"
                  className={cn("font-medium", v.eta_after_client_due && "text-destructive")}
                >
                  {formatDate(v.eta)}
                  {v.eta_after_client_due && <span className="block text-xs">After client due date</span>}
                </dd>
              </div>
              <Item label="PO value" value={formatINR(v.po_value)} />
              <Item label="Paid" value={formatINR(v.paid)} />
              <Item label="Payable now" value={formatINR(v.payable_now)} hint="Owed for goods received" />
              <Item label="Open commitment" value={formatINR(v.balance_due)} />
            </dl>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Payments</p>
              {paid.length === 0 ? (
                <p className="text-xs text-muted-foreground">No payments yet.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {paid.map((p) => (
                    <li key={p.id} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-xs">
                      <span>{formatDate(p.paid_on)}</span>
                      <span className="tabular-nums">{formatINR(p.amount)}</span>
                      <span className="text-muted-foreground">
                        {p.mode ?? "—"} {p.reference ? `· ${p.reference}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Item({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground" title={hint}>
        {label}
      </dt>
      <dd className="truncate tabular-nums">{value}</dd>
    </div>
  );
}
