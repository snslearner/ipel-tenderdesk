"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Chip, EmptyState } from "@/components/list-bits";
import { Rating, VENDOR_TYPE_LABEL, type VendorType } from "@/components/masters/bits";

export type VendorRow = {
  id: string;
  name: string;
  type: VendorType;
  city: string | null;
  specialisation: string | null;
  iso_certified: boolean;
  quality_rating: number | null;
  certs_expiring: number;
};

export function VendorList({ rows, initialType }: { rows: VendorRow[]; initialType: string }) {
  const [type, setType] = useState<VendorType | "">((initialType in VENDOR_TYPE_LABEL ? initialType : "") as VendorType | "");
  const [isoOnly, setIsoOnly] = useState(false);
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const c = { oem: 0, supplier: 0, subcontractor: 0 } as Record<VendorType, number>;
    for (const r of rows) c[r.type]++;
    return c;
  }, [rows]);

  const visible = rows.filter(
    (r) =>
      (!type || r.type === type) &&
      (!isoOnly || r.iso_certified) &&
      (!q || `${r.name} ${r.specialisation ?? ""} ${r.city ?? ""}`.toLowerCase().includes(q.toLowerCase())),
  );

  function pickType(t: VendorType | "") {
    setType(t);
    window.history.replaceState(null, "", t ? `/vendors?type=${t}` : "/vendors");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
        <Chip active={!type} onClick={() => pickType("")}>
          All <span className="text-muted-foreground">{rows.length}</span>
        </Chip>
        {(Object.keys(VENDOR_TYPE_LABEL) as VendorType[]).map((t) => (
          <Chip key={t} active={type === t} onClick={() => pickType(t)}>
            {VENDOR_TYPE_LABEL[t]} <span className="text-muted-foreground">{counts[t]}</span>
          </Chip>
        ))}
        <Chip active={isoOnly} onClick={() => setIsoOnly(!isoOnly)}>
          ISO certified
        </Chip>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search vendors"
          placeholder="Search name, specialisation or city"
          className="pl-8"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <p className="text-sm text-muted-foreground" data-testid="vendor-count">
        Showing {visible.length} of {rows.length}
      </p>
      {rows.length === 0 ? (
        <EmptyState>No vendors yet.</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState>No vendors match these filters.</EmptyState>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((v) => (
            <li key={v.id}>
              <Link
                href={`/vendors/${v.id}`}
                data-testid="vendor-card"
                className="block h-full space-y-2 rounded-xl border bg-card p-3 hover:bg-accent/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 font-medium break-words">{v.name}</span>
                  <Badge variant="outline" data-testid="vendor-type">
                    {VENDOR_TYPE_LABEL[v.type]}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {v.specialisation ?? "—"}
                  {v.city ? ` · ${v.city}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Rating value={v.quality_rating} />
                  {v.iso_certified && (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <ShieldCheck className="size-3.5" /> ISO
                    </span>
                  )}
                  {v.certs_expiring > 0 && (
                    <Badge variant="destructive">{v.certs_expiring} certificate(s) expiring</Badge>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
