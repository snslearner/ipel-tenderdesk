"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatINR, formatPct, formatQty } from "@/lib/format";
import { lineMarginPct, type TenderStatus } from "@/lib/tenders";
import { StatusBadge } from "./status-badge";
import type { ItemRow } from "./items-tab";

export type HistoryRow = {
  part_number: string | null;
  tender_id: string | null;
  ref_no: string | null;
  tender_status: TenderStatus | null;
  published_on: string | null;
  client_name: string | null;
  qty: number | null;
  unit_cost: number | null;
  unit_bid_price: number | null;
  vendor_name: string | null;
};

// Past tender lines for the selected line's part number, from v_part_history.
export function HistoryTab({ items, history }: { items: ItemRow[]; history: HistoryRow[] }) {
  const lines = items.filter((i) => i.part_number);
  const [part, setPart] = useState(lines[0]?.part_number ?? "");

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No line has a part number, so there is no history to show.
      </div>
    );
  }
  const rows = history.filter((h) => h.part_number === part);

  return (
    <div className="space-y-3">
      <select
        aria-label="Part number"
        className="h-8 w-full max-w-md rounded-lg border border-input bg-transparent px-2.5 text-sm"
        value={part}
        onChange={(e) => setPart(e.target.value)}
      >
        {lines.map((l) => (
          <option key={l.id} value={l.part_number!}>
            Line {l.line_no}: {l.part_number} {l.product_name ? `· ${l.product_name}` : ""}
          </option>
        ))}
      </select>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {part} has not appeared in any other tender.
        </div>
      ) : (
        <ul className="space-y-2" data-testid="part-history">
          {rows.map((h, i) => (
            <li key={`${h.tender_id}-${i}`} className="space-y-1 rounded-xl border bg-card p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/tenders/${h.tender_id}`} className="font-medium underline-offset-4 hover:underline">
                  {h.ref_no}
                </Link>
                {h.tender_status && <StatusBadge status={h.tender_status} />}
              </div>
              <p className="truncate text-muted-foreground">
                {h.client_name} · {formatDate(h.published_on)}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>Qty {formatQty(h.qty)}</span>
                <span>Cost {formatINR(h.unit_cost)}</span>
                <span>Bid {formatINR(h.unit_bid_price)}</span>
                <span>Margin {formatPct(lineMarginPct(h.unit_cost, h.unit_bid_price))}</span>
                <span className="min-w-0 truncate">Vendor {h.vendor_name ?? "—"}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
