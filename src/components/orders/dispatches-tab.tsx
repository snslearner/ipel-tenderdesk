"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/list-bits";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatQty, todayIST } from "@/lib/format";
import { useDbAction } from "@/components/use-db-action";
import type { DispatchRow, LineRow, PoSummary } from "./types";

export function DispatchesTab({ po, lines, dispatches }: { po: PoSummary; lines: LineRow[]; dispatches: DispatchRow[] }) {
  const partOf = new Map(lines.map((l) => [l.client_po_item_id, l.part_number ?? "—"]));
  const blocked = po.status !== "acknowledged" && po.status !== "in_execution";

  return (
    <div className="space-y-4">
      {dispatches.length === 0 ? (
        <EmptyState>No delivery challans yet.</EmptyState>
      ) : (
        <ul className="space-y-2" data-testid="dispatches">
          {dispatches.map((d) => (
            <DispatchItem key={d.id} d={d} partOf={partOf} />
          ))}
        </ul>
      )}
      {po.pending_qty > 0 && <NewDispatch po={po} lines={lines} blocked={blocked} />}
    </div>
  );
}

function DispatchItem({ d, partOf }: { d: DispatchRow; partOf: Map<string | null, string> }) {
  const { pending, run } = useDbAction();
  return (
    <li data-testid="dispatch" className="space-y-2 rounded-xl border bg-card p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium break-all">{d.dc_number}</span>
        {d.signed_sealed_stamped ? (
          <Badge variant="outline" className="border-emerald-600/40 text-emerald-700">Signed, sealed, stamped</Badge>
        ) : (
          <Badge variant="destructive">Not signed/sealed/stamped</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Dispatched {formatDate(d.dispatched_on)} · received {formatDate(d.received_on)}
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {d.dispatch_items.map((i) => (
          <li key={i.client_po_item_id}>
            {partOf.get(i.client_po_item_id) ?? "—"}: {formatQty(i.qty)}
          </li>
        ))}
      </ul>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={d.signed_sealed_stamped}
          disabled={pending}
          onChange={(e) =>
            run("Challan updated", () =>
              createClient().from("dispatches").update({ signed_sealed_stamped: e.target.checked }).eq("id", d.id),
            )
          }
        />
        Client copy signed, sealed and stamped
      </label>
    </li>
  );
}

function NewDispatch({ po, lines, blocked }: { po: PoSummary; lines: LineRow[]; blocked: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dc, setDc] = useState("");
  const [date, setDate] = useState(todayIST());
  const [sss, setSss] = useState(false);
  const [qty, setQty] = useState<Record<string, string>>({});
  const open = lines.filter((l) => (l.pending_qty ?? 0) > 0);

  const items = open
    .map((l) => ({ client_po_item_id: l.client_po_item_id!, qty: Number(qty[l.client_po_item_id!] || 0) }))
    .filter((i) => i.qty > 0);
  const invalid = items.some((i) => Number.isNaN(i.qty)) || !dc.trim() || items.length === 0;

  function submit() {
    startTransition(async () => {
      // One transaction: challan and lines are saved together or not at all. The database
      // refuses a dispatch unless the PO is acknowledged or in execution, and any line qty
      // above what is pending. Its message is shown as-is.
      const { error } = await createClient().rpc("record_dispatch", {
        p_po_id: po.id,
        p_dc_number: dc.trim(),
        p_dispatched_on: date,
        p_signed: sss,
        p_lines: items,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Dispatch ${dc.trim()} recorded`);
      setDc("");
      setQty({});
      setSss(false);
      router.refresh();
    });
  }

  return (
    <form
      className="space-y-3 rounded-xl border p-3"
      data-testid="new-dispatch"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="text-sm font-medium">New dispatch</p>
      {blocked && (
        <p role="status" className="text-xs text-destructive">
          PO status is {po.status.replace("_", " ")}: the database will refuse a dispatch until the PO is acknowledged.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="dc-number">Delivery challan no.</Label>
          <Input id="dc-number" value={dc} onChange={(e) => setDc(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dc-date">Dispatched on</Label>
          <Input id="dc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <ul className="space-y-2">
        {open.map((l) => (
          <li key={l.client_po_item_id} className="flex items-center gap-3 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{l.part_number}</span>
              <span className="text-xs text-muted-foreground">Pending {formatQty(l.pending_qty)}</span>
            </span>
            <Input
              aria-label={`Dispatch qty for ${l.part_number}`}
              inputMode="decimal"
              className="w-24 text-right"
              placeholder="0"
              value={qty[l.client_po_item_id!] ?? ""}
              onChange={(e) => setQty((q) => ({ ...q, [l.client_po_item_id!]: e.target.value }))}
            />
          </li>
        ))}
      </ul>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-primary" checked={sss} onChange={(e) => setSss(e.target.checked)} />
        Signed, sealed and stamped by the client
      </label>
      <Button type="submit" disabled={invalid || pending}>
        {pending ? "Saving…" : "Record dispatch"}
      </Button>
    </form>
  );
}
