"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/list-bits";

type Row = { id: string; part_number: string; name: string; spec: string | null; standard: string | null; uom: string };

export function ProductList({ rows, initialQuery }: { rows: Row[]; initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const needle = q.trim().toLowerCase();
  const visible = rows.filter(
    (r) => !needle || r.part_number.toLowerCase().includes(needle) || r.name.toLowerCase().includes(needle),
  );

  function update(v: string) {
    setQ(v);
    window.history.replaceState(null, "", v.trim() ? `/products?q=${encodeURIComponent(v.trim())}` : "/products");
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search products"
          placeholder="Search part number or name"
          className="pl-8"
          value={q}
          onChange={(e) => update(e.target.value)}
        />
      </div>
      <p className="text-sm text-muted-foreground" data-testid="product-count">
        Showing {visible.length} of {rows.length}
      </p>
      {rows.length === 0 ? (
        <EmptyState>No products yet.</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState>No part number matches “{q}”.</EmptyState>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <li key={p.id}>
              <Link href={`/products/${p.id}`} data-testid="product-card" className="block h-full space-y-1 rounded-xl border bg-card p-3 text-sm hover:bg-accent/50">
                <p className="font-medium">{p.part_number}</p>
                <p className="break-words">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[p.standard, p.spec, p.uom].filter(Boolean).join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
