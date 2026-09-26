import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR, formatPct } from "@/lib/format";
import { poFlags, type PoStatus } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/list-bits";
import { BackLink, CLIENT_TYPE_LABEL, Fact, Section } from "@/components/masters/bits";
import { StatusBadge } from "@/components/tenders/status-badge";
import { PoFlags, PoStatusBadge } from "@/components/orders/po-badges";

export const metadata: Metadata = { title: "Client · IPEL TenderDesk" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const [cRes, tRes, oRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("v_tender_summary")
      .select("id, ref_no, title, status, submission_due, total_bid, margin_pct")
      .eq("client_id", id)
      .order("submission_due", { ascending: false, nullsFirst: false }),
    supabase
      .from("v_po_overview")
      .select("id, po_number, status, effective_due, total_value, pending_value, extension_due, vendor_eta_late, ready_to_claim")
      .eq("client_id", id)
      .order("po_date", { ascending: false }),
  ]);
  for (const r of [cRes, tRes, oRes]) if (r.error) throw new Error(`Could not load client: ${r.error.message}`);
  const c = cRes.data;
  if (!c) notFound();

  return (
    <div className="space-y-6">
      <BackLink href="/clients">Clients</BackLink>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight break-words" data-testid="client-name">
            {c.name}
          </h1>
          <Badge variant="outline">{CLIENT_TYPE_LABEL[c.type]}</Badge>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm lg:grid-cols-4">
          <Fact label="Portal">{c.portal_name ?? "—"}</Fact>
          <Fact label="GSTIN">{c.gstin ?? "—"}</Fact>
          <Fact label="Contact">{c.contact_person ?? "—"}</Fact>
          <Fact label="Phone">{c.phone ?? "—"}</Fact>
          <Fact label="Email">{c.email ?? "—"}</Fact>
          <Fact label="Address">{c.address ?? "—"}</Fact>
        </dl>
      </header>

      <Section title={`Orders (${oRes.data!.length})`} testId="client-orders">
        {oRes.data!.length === 0 ? (
          <EmptyState>No purchase orders from this client yet.</EmptyState>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {oRes.data!.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="block space-y-1 rounded-xl border bg-card p-3 text-sm hover:bg-accent/50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium break-all">{o.po_number}</span>
                    <PoStatusBadge status={o.status as PoStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDate(o.effective_due)} · value {formatINR(o.total_value)} · pending {formatINR(o.pending_value)}
                  </p>
                  <PoFlags flags={poFlags({ ...o, status: o.status as PoStatus })} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Tenders (${tRes.data!.length})`} testId="client-tenders">
        {tRes.data!.length === 0 ? (
          <EmptyState>No tenders for this client yet.</EmptyState>
        ) : (
          <ul className="divide-y rounded-xl border bg-card text-sm">
            {tRes.data!.map((t) => (
              <li key={t.id}>
                <Link href={`/tenders/${t.id}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 hover:bg-accent/50">
                  <span className="min-w-0">
                    <span className="font-medium whitespace-nowrap">{t.ref_no}</span>
                    <span className="block truncate text-xs text-muted-foreground">{t.title}</span>
                  </span>
                  <span className="flex items-center gap-3 text-xs">
                    <span className="whitespace-nowrap">{formatDate(t.submission_due)}</span>
                    <span className="tabular-nums">{t.total_bid ? formatINR(t.total_bid) : "—"}</span>
                    <span>{formatPct(t.margin_pct)}</span>
                    {t.status && <StatusBadge status={t.status} />}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
