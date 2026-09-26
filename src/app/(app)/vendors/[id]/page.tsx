import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { expiryState, formatDate, formatINR, todayIST } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/list-bits";
import { BackLink, Fact, Rating, Section, VENDOR_TYPE_LABEL } from "@/components/masters/bits";

export const metadata: Metadata = { title: "Vendor · IPEL TenderDesk" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VendorPage({ params }: PageProps<"/vendors/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const [vRes, certRes, priceRes, poRes] = await Promise.all([
    supabase.from("vendors").select("*").eq("id", id).maybeSingle(),
    supabase.from("vendor_certificates").select("id, name, number, valid_until").eq("vendor_id", id).order("valid_until"),
    supabase
      .from("vendor_prices")
      .select("id, unit_price, quoted_on, lead_time_days, products(id, part_number, name, uom)")
      .eq("vendor_id", id)
      .order("quoted_on", { ascending: false })
      .limit(200),
    supabase
      .from("v_vendor_po_balance")
      .select("vendor_po_id, po_number, client_po_id, client_po_number, po_date, eta, status, po_value, paid, payable_now, eta_after_client_due")
      .eq("vendor_id", id)
      .order("po_date", { ascending: false }),
  ]);
  for (const r of [vRes, certRes, priceRes, poRes]) if (r.error) throw new Error(`Could not load vendor: ${r.error.message}`);
  const v = vRes.data;
  if (!v) notFound();
  const today = todayIST();

  return (
    <div className="space-y-6">
      <BackLink href="/vendors">Vendors</BackLink>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight break-words" data-testid="vendor-name">
            {v.name}
          </h1>
          <Badge variant="outline">{VENDOR_TYPE_LABEL[v.type]}</Badge>
          {v.iso_certified && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
              <ShieldCheck className="size-4" /> ISO certified
            </span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm lg:grid-cols-4">
          <Fact label="Rating">
            <Rating value={v.quality_rating} />
          </Fact>
          <Fact label="Specialisation">{v.specialisation ?? "—"}</Fact>
          <Fact label="City">{v.city ?? "—"}</Fact>
          <Fact label="GSTIN">{v.gstin ?? "—"}</Fact>
          <Fact label="Contact">{v.contact_person ?? "—"}</Fact>
          <Fact label="Phone">{v.phone ?? "—"}</Fact>
          <Fact label="Email">{v.email ?? "—"}</Fact>
        </dl>
        {v.notes && <p className="rounded-lg bg-muted px-3 py-2 text-sm">{v.notes}</p>}
      </header>

      <Section title="Certificates" testId="vendor-certificates">
        {certRes.data!.length === 0 ? (
          <EmptyState>No certificates on file.</EmptyState>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {certRes.data!.map((c) => {
              const s = expiryState(c.valid_until, today);
              return (
                <li key={c.id} className="space-y-1 rounded-xl border bg-card p-3 text-sm">
                  <p className="font-medium break-words">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.number ?? "No number"}</p>
                  <p
                    data-testid="cert-expiry"
                    data-state={s}
                    className={cn("text-xs", (s === "soon" || s === "expired") && "font-medium text-destructive")}
                  >
                    {s === "expired" ? "Expired " : "Valid until "}
                    {formatDate(c.valid_until)}
                    {s === "soon" && " · within 30 days"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Price history" testId="vendor-prices">
        {priceRes.data!.length === 0 ? (
          <EmptyState>No quotes recorded.</EmptyState>
        ) : (
          <ul className="divide-y rounded-xl border bg-card text-sm">
            {priceRes.data!.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2">
                <Link href={`/products/${p.products?.id}`} className="min-w-0 font-medium underline-offset-4 hover:underline">
                  {p.products?.part_number}
                  <span className="block truncate text-xs font-normal text-muted-foreground">{p.products?.name}</span>
                </Link>
                <span className="tabular-nums">
                  {formatINR(p.unit_price)} / {p.products?.uom}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(p.quoted_on)}
                  {p.lead_time_days != null && ` · ${p.lead_time_days} days lead`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Vendor POs" testId="vendor-pos">
        {poRes.data!.length === 0 ? (
          <EmptyState>No purchase orders placed with this vendor.</EmptyState>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {poRes.data!.map((p) => (
              <li key={p.vendor_po_id} className="space-y-1 rounded-xl border bg-card p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium break-all">{p.po_number}</span>
                  <Badge variant="outline" className="capitalize">
                    {p.status?.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs">
                  For{" "}
                  <Link href={`/orders/${p.client_po_id}`} className="underline underline-offset-4">
                    {p.client_po_number}
                  </Link>{" "}
                  · {formatDate(p.po_date)}
                </p>
                <p className={cn("text-xs", p.eta_after_client_due && "font-medium text-destructive")}>
                  ETA {formatDate(p.eta)}
                  {p.eta_after_client_due && " · after client due date"}
                </p>
                <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span>Value {formatINR(p.po_value)}</span>
                  <span>Paid {formatINR(p.paid)}</span>
                  <span>Owed now {formatINR(p.payable_now)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
