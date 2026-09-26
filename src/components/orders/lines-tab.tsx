import { EmptyState } from "@/components/list-bits";
import { formatINR, formatQty } from "@/lib/format";
import type { LineRow } from "./types";

// Straight from v_po_lines: delivered = sum of dispatch items, pending = ordered - delivered.
export function LinesTab({ lines }: { lines: LineRow[] }) {
  if (lines.length === 0) return <EmptyState>This PO has no lines.</EmptyState>;
  return (
    <ul className="space-y-2" data-testid="po-lines">
      {lines.map((l) => (
        <li
          key={l.client_po_item_id}
          className="grid grid-cols-3 gap-2 rounded-xl border bg-card p-3 text-sm lg:grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] lg:items-center"
        >
          <div className="col-span-3 min-w-0 lg:col-span-1">
            <p className="truncate font-medium">{l.part_number ?? "No part number"}</p>
            <p className="truncate text-xs text-muted-foreground">{l.product_name}</p>
          </div>
          <Num label="Ordered" value={formatQty(l.ordered_qty)} />
          <Num label="Delivered" value={formatQty(l.delivered_qty)} />
          <Num label="Pending" value={formatQty(l.pending_qty)} strong={(l.pending_qty ?? 0) > 0} />
          <Num label="Unit price" value={formatINR(l.unit_price)} />
          <Num label="Pending value" value={formatINR(l.pending_value)} />
        </li>
      ))}
    </ul>
  );
}

function Num({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0 lg:text-right">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`truncate tabular-nums ${strong ? "font-medium" : ""}`}>{value}</p>
    </div>
  );
}
