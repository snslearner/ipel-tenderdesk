"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/list-bits";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { Role } from "@/lib/auth/roles";
import { useDbAction } from "@/components/use-db-action";
import type { DiscrepancyRow, PoSummary } from "./types";

const FIELD_LABEL: Record<string, string> = {
  part_number: "Part number",
  qty: "Quantity",
  unit_price: "Unit price",
  due_date: "Due date",
  line: "Extra line",
};

export function DiscrepanciesTab({ po, role, discrepancies }: { po: PoSummary; role: Role | null; discrepancies: DiscrepancyRow[] }) {
  const { pending, run } = useDbAction();
  const owner = role === "owner";
  const supabase = createClient();

  return (
    <div className="space-y-4">
      {po.status === "locked" && (
        <p role="status" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
          This PO does not match the bid. It stays locked (no acknowledgement, no dispatch) until every
          discrepancy has an amendment reference and the owner releases it.
        </p>
      )}

      <div className="flex flex-wrap gap-2" data-testid="po-owner-actions">
        {owner && po.status === "locked" && (
          <Button
            disabled={pending}
            onClick={() => run("Lock released", () => supabase.rpc("release_po_lock", { p_po_id: po.id }))}
          >
            Release lock
          </Button>
        )}
        {owner && po.status === "received" && (
          <Button
            disabled={pending}
            onClick={() => run("PO acknowledged", () => supabase.rpc("acknowledge_po", { p_po_id: po.id }))}
          >
            Acknowledge PO
          </Button>
        )}
        {!owner && (po.status === "locked" || po.status === "received") && (
          <p className="text-sm text-muted-foreground">
            {po.status === "locked" ? "Only the owner can release the lock." : "Waiting for the owner to acknowledge this PO."}
          </p>
        )}
      </div>

      {discrepancies.length === 0 ? (
        <EmptyState>The PO matches the bid: no discrepancies.</EmptyState>
      ) : (
        <ul className="space-y-2" data-testid="discrepancies">
          {discrepancies.map((d) => (
            <DiscrepancyItem key={d.id} d={d} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DiscrepancyItem({ d }: { d: DiscrepancyRow }) {
  const { pending, run } = useDbAction();
  const [ref, setRef] = useState(d.amendment_ref ?? "");
  const open = !d.resolved_on;
  const dirty = ref.trim() !== (d.amendment_ref ?? "");

  return (
    <li data-testid="discrepancy" className="space-y-2 rounded-xl border bg-card p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">
          {FIELD_LABEL[d.field] ?? d.field}
          {d.part_number && <span className="font-normal text-muted-foreground"> · {d.part_number}</span>}
        </span>
        {open ? <Badge variant="destructive">Open</Badge> : <Badge variant="outline">Resolved {formatDate(d.resolved_on)}</Badge>}
      </div>
      <dl className="grid grid-cols-2 gap-2">
        <div>
          <dt className="text-xs text-muted-foreground">Expected (bid)</dt>
          <dd data-testid="disc-expected" className="break-words">{d.expected ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Actual (PO)</dt>
          <dd data-testid="disc-actual" className="break-words">{d.actual ?? "—"}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">Raised {formatDate(d.raised_on)}</p>
      {open && d.amendment_ref && (
        <p className="text-xs text-emerald-700" data-testid="saved-ref">
          Amendment on file: {d.amendment_ref}
        </p>
      )}
      {open ? (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            run("Amendment reference saved", () =>
              createClient().from("po_discrepancies").update({ amendment_ref: ref.trim() || null }).eq("id", d.id),
            );
          }}
        >
          <Input
            aria-label="Amendment reference"
            placeholder="Client amendment reference"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="sm:max-w-xs"
          />
          <Button type="submit" variant="outline" size="sm" disabled={!dirty || pending} className="sm:h-8">
            Save reference
          </Button>
        </form>
      ) : (
        <p className="text-xs">Amendment: {d.amendment_ref ?? "—"}</p>
      )}
    </li>
  );
}
