import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINRCompact } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/list-bits";
import { CLIENT_TYPE_LABEL } from "@/components/masters/bits";

export const metadata: Metadata = { title: "Clients · IPEL TenderDesk" };

export default async function ClientsPage() {
  const supabase = await createClient();
  const [cRes, tRes, oRes] = await Promise.all([
    supabase.from("clients").select("id, name, type, portal_name, contact_person").order("name"),
    supabase.from("v_tender_summary").select("client_id, status"),
    supabase.from("v_po_overview").select("client_id, status, pending_value"),
  ]);
  for (const r of [cRes, tRes, oRes]) if (r.error) throw new Error(`Could not load clients: ${r.error.message}`);

  const stats = new Map<string, { tenders: number; won: number; orders: number; open: number; pending: number }>();
  for (const c of cRes.data!) stats.set(c.id, { tenders: 0, won: 0, orders: 0, open: 0, pending: 0 });
  for (const t of tRes.data!) {
    const s = t.client_id && stats.get(t.client_id);
    if (s) {
      s.tenders++;
      if (t.status === "won") s.won++;
    }
  }
  for (const o of oRes.data!) {
    const s = o.client_id && stats.get(o.client_id);
    if (s) {
      s.orders++;
      if (o.status !== "closed") s.open++;
      s.pending += o.pending_value ?? 0;
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Clients</h1>
      {cRes.data!.length === 0 ? (
        <EmptyState>No clients yet.</EmptyState>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {cRes.data!.map((c) => {
            const s = stats.get(c.id)!;
            return (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`} data-testid="client-card" className="block h-full space-y-2 rounded-xl border bg-card p-3 hover:bg-accent/50">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 font-medium break-words">{c.name}</span>
                    <Badge variant="outline" className="shrink-0">
                      {CLIENT_TYPE_LABEL[c.type]}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.portal_name ?? "No portal"} {c.contact_person ? `· ${c.contact_person}` : ""}
                  </p>
                  <p className="flex flex-wrap gap-x-3 text-xs">
                    <span>
                      {s.tenders} tenders ({s.won} won)
                    </span>
                    <span>{s.open} open orders</span>
                    <span>{formatINRCompact(s.pending)} pending</span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
