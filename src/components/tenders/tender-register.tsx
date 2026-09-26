"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatINR, formatINRCompact, formatPct } from "@/lib/format";
import {
  STATUS_LABEL,
  TENDER_STATUSES,
  filterTenders,
  tenderFiltersToQuery,
  type TenderFilters,
  type TenderStatus,
} from "@/lib/tenders";
import { StatusBadge } from "./status-badge";

export type TenderRow = {
  id: string;
  ref_no: string;
  title: string;
  client_id: string;
  client_name: string;
  status: TenderStatus;
  submission_due: string | null;
  total_bid: number | null;
  margin_pct: number | null;
};

const features = tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel() });
const col = createColumnHelper<typeof features, TenderRow>();
const columns = col.columns([
  col.accessor("ref_no", {
    header: "Ref",
    cell: (c) => (
      <Link href={`/tenders/${c.row.original.id}`} className="font-medium underline-offset-4 hover:underline">
        {c.getValue()}
      </Link>
    ),
  }),
  col.accessor("title", { header: "Title", cell: (c) => <span className="line-clamp-2">{c.getValue()}</span> }),
  col.accessor("client_name", { header: "Client" }),
  col.accessor("status", {
    header: "Status",
    cell: (c) => <StatusBadge status={c.getValue()} />,
    sortFn: (a, b) =>
      TENDER_STATUSES.indexOf(a.original.status) - TENDER_STATUSES.indexOf(b.original.status),
  }),
  col.accessor("submission_due", {
    header: "Submission due",
    cell: (c) => <span className="whitespace-nowrap">{formatDate(c.getValue())}</span>,
    sortUndefined: "last",
  }),
  col.accessor("total_bid", {
    header: "Bid value",
    cell: (c) => <span className="whitespace-nowrap tabular-nums">{formatINR(c.getValue())}</span>,
    meta: { align: "right" },
  }),
  col.accessor("margin_pct", {
    header: "Margin %",
    cell: (c) => <span className="tabular-nums">{formatPct(c.getValue())}</span>,
    sortUndefined: "last",
    meta: { align: "right" },
  }),
]);

type Props = { rows: TenderRow[]; clients: { id: string; name: string }[]; initialFilters: TenderFilters };

export function TenderRegister({ rows, clients, initialFilters }: Props) {
  const [filters, setFilters] = useState(initialFilters);

  function update(next: TenderFilters) {
    setFilters(next);
    // Keep the URL shareable (dashboard cards link here with filters) without a server round trip.
    window.history.replaceState(null, "", `/tenders${tenderFiltersToQuery(next)}`);
  }

  function toggleStatus(s: TenderStatus) {
    const statuses = filters.statuses.includes(s)
      ? filters.statuses.filter((x) => x !== s)
      : TENDER_STATUSES.filter((x) => x === s || filters.statuses.includes(x));
    update({ ...filters, statuses });
  }

  const counts = useMemo(() => {
    const c = {} as Record<TenderStatus, number>;
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = useMemo(() => filterTenders(rows, filters), [rows, filters]);
  const table = useTable({ features, columns, data: visible });
  const sortedRows = table.getRowModel().rows;
  const hasFilters = filters.statuses.length > 0 || !!filters.client || !!filters.q;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <Chip active={filters.statuses.length === 0} onClick={() => update({ ...filters, statuses: [] })}>
          All <span className="text-muted-foreground">{rows.length}</span>
        </Chip>
        {TENDER_STATUSES.filter((s) => counts[s]).map((s) => (
          <Chip key={s} active={filters.statuses.includes(s)} onClick={() => toggleStatus(s)}>
            {STATUS_LABEL[s]} <span className="text-muted-foreground">{counts[s]}</span>
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search tenders"
            placeholder="Search ref or title"
            className="pl-8"
            value={filters.q}
            onChange={(e) => update({ ...filters, q: e.target.value })}
          />
        </div>
        <select
          aria-label="Filter by client"
          className="h-8 min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm sm:w-64"
          value={filters.client}
          onChange={(e) => update({ ...filters, client: e.target.value })}
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span data-testid="tender-count">
          Showing {visible.length} of {rows.length}
        </span>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => update({ statuses: [], client: "", q: "" })}>
            Clear filters
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Empty>No tenders yet.</Empty>
      ) : visible.length === 0 ? (
        <Empty>No tenders match these filters.</Empty>
      ) : (
        <>
          {/* Wide screens: sortable table */}
          <div className="hidden overflow-hidden rounded-xl border lg:block">
            <table className="w-full text-sm" data-testid="tender-table">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                {table.getHeaderGroups().map((g) => (
                  <tr key={g.id}>
                    {g.headers.map((h) => {
                      const sorted = h.column.getIsSorted();
                      const right = (h.column.columnDef.meta as { align?: string } | undefined)?.align === "right";
                      return (
                        <th key={h.id} className={cn("px-3 py-2 font-medium", right && "text-right")}>
                          <button
                            type="button"
                            onClick={h.column.getToggleSortingHandler()}
                            className={cn("inline-flex items-center gap-1 hover:text-foreground", right && "flex-row-reverse")}
                          >
                            <table.FlexRender header={h} />
                            {sorted === "asc" && <ArrowUp className="size-3" />}
                            {sorted === "desc" && <ArrowDown className="size-3" />}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {sortedRows.map((row) => (
                  <tr key={row.id} data-testid="tender-row" className="hover:bg-muted/30">
                    {row.getAllCells().map((cell) => {
                      const right = (cell.column.columnDef.meta as { align?: string } | undefined)?.align === "right";
                      return (
                        <td key={cell.id} className={cn("px-3 py-2 align-top", right && "text-right")}>
                          <table.FlexRender cell={cell} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones and tablets: cards */}
          <ul className="grid gap-2 lg:hidden" data-testid="tender-cards">
            {sortedRows.map(({ original: t }) => (
              <li key={t.id}>
                <Link
                  href={`/tenders/${t.id}`}
                  data-testid="tender-card"
                  className="block space-y-2 rounded-xl border bg-card p-3 hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{t.ref_no}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="line-clamp-2 text-sm">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.client_name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Due {formatDate(t.submission_due)}</span>
                    <span>Bid {formatINRCompact(t.total_bid)}</span>
                    <span>Margin {formatPct(t.margin_pct)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
        active ? "border-primary bg-primary text-primary-foreground [&_span]:text-primary-foreground/70" : "hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{children}</div>
  );
}
