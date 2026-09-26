"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { formatINR, formatPct, formatQty } from "@/lib/format";
import { canEditItems, lineMarginPct, type TenderStatus } from "@/lib/tenders";

export type ItemRow = {
  id: string;
  line_no: number;
  description: string | null;
  qty: number;
  uom: string;
  vendor_id: string | null;
  unit_cost: number | null;
  unit_bid_price: number | null;
  part_number: string | null;
  product_name: string | null;
};
export type VendorOption = { id: string; name: string; type: string };

const GRID = "lg:grid lg:grid-cols-[3rem_minmax(0,2fr)_6rem_minmax(0,1.4fr)_8rem_8rem_5rem_5rem] lg:items-center lg:gap-3";

export function ItemsTab({ status, items, vendors }: { status: TenderStatus; items: ItemRow[]; vendors: VendorOption[] }) {
  const editable = canEditItems(status);
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No line items yet.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {!editable && (
        <p className="text-xs text-muted-foreground">Lines are read-only once a bid goes to owner review.</p>
      )}
      <div className={`hidden px-3 text-xs text-muted-foreground ${GRID}`}>
        <span>#</span>
        <span>Part / description</span>
        <span className="text-right">Qty</span>
        <span>Vendor</span>
        <span className="text-right">Unit cost</span>
        <span className="text-right">Unit bid</span>
        <span className="text-right">Margin</span>
        <span />
      </div>
      <ul className="space-y-2" data-testid="tender-items">
        {items.map((item) => (
          <ItemLine key={item.id} item={item} vendors={vendors} editable={editable} />
        ))}
      </ul>
    </div>
  );
}

const toNum = (s: string) => (s.trim() === "" ? null : Number(s));

function ItemLine({ item, vendors, editable }: { item: ItemRow; vendors: VendorOption[]; editable: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [vendorId, setVendorId] = useState(item.vendor_id ?? "");
  const [cost, setCost] = useState(item.unit_cost?.toString() ?? "");
  const [bid, setBid] = useState(item.unit_bid_price?.toString() ?? "");

  const costN = toNum(cost);
  const bidN = toNum(bid);
  const invalid = [costN, bidN].some((n) => n != null && (Number.isNaN(n) || n < 0));
  const dirty = vendorId !== (item.vendor_id ?? "") || costN !== item.unit_cost || bidN !== item.unit_bid_price;
  const margin = invalid ? null : lineMarginPct(costN, bidN);
  const vendorName = vendors.find((v) => v.id === item.vendor_id)?.name ?? "—";

  function save() {
    startTransition(async () => {
      const { error } = await createClient()
        .from("tender_items")
        .update({ vendor_id: vendorId || null, unit_cost: costN, unit_bid_price: bidN })
        .eq("id", item.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Line ${item.line_no} saved`);
      router.refresh();
    });
  }

  return (
    <li data-testid="tender-item" className={`space-y-2 rounded-xl border bg-card p-3 lg:space-y-0 ${GRID}`}>
      <span className="text-xs text-muted-foreground lg:text-sm">
        <span className="lg:hidden">Line </span>
        {item.line_no}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.part_number ?? "No part number"}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description ?? item.product_name}</p>
      </div>
      <p className="text-sm lg:text-right">
        <span className="text-muted-foreground lg:hidden">Qty </span>
        {formatQty(item.qty)} {item.uom}
      </p>

      {editable ? (
        <>
          <select
            aria-label={`Vendor for line ${item.line_no}`}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
          >
            <option value="">Choose vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 lg:contents">
            <Input
              aria-label={`Unit cost for line ${item.line_no}`}
              inputMode="decimal"
              placeholder="Unit cost"
              className="text-right"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
            <Input
              aria-label={`Unit bid price for line ${item.line_no}`}
              inputMode="decimal"
              placeholder="Unit bid"
              className="text-right"
              value={bid}
              onChange={(e) => setBid(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <p className="truncate text-sm">
            <span className="text-muted-foreground lg:hidden">Vendor </span>
            {vendorName}
          </p>
          <p className="text-sm tabular-nums lg:text-right">
            <span className="text-muted-foreground lg:hidden">Cost </span>
            {formatINR(item.unit_cost)}
          </p>
          <p className="text-sm tabular-nums lg:text-right">
            <span className="text-muted-foreground lg:hidden">Bid </span>
            {formatINR(item.unit_bid_price)}
          </p>
        </>
      )}

      <p className="text-sm tabular-nums lg:text-right" data-testid="line-margin">
        <span className="text-muted-foreground lg:hidden">Margin </span>
        {formatPct(margin)}
      </p>
      <div className="lg:text-right">
        {editable && (
          <Button size="sm" onClick={save} disabled={!dirty || invalid || pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        )}
      </div>
    </li>
  );
}
