"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
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
import { Chip, EmptyState } from "@/components/list-bits";
import { formatDate, formatINR, formatINRCompact } from "@/lib/format";
import {
  PO_STATUSES,
  PO_STATUS_LABEL,
  QUICK_FILTERS,
  dueInfo,
  filterOrders,
  orderFiltersToQuery,
  poFlags,
  type OrderFilterRow,
  type OrderFilters,
  type PoStatus,
} from "@/lib/orders";
import { PoFlags, PoStatusBadge } from "./po-badges";

export type OrderRow = OrderFilterRow & {
  id: string;
  effective_due: string | null;
  pending_value: number | null;
};

function Due({ row }: { row: OrderRow }) {
  const d = dueInfo(row.days_to_due, row.pending_qty);
  return (
    <span className="whitespace-nowrap">
      {formatDate(row.effective_due)}
      <span className={cn("block text-xs", d.overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
        {d.text}
      </span>
    </span>
  );
}

const features = tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel() });
const col = createColumnHelper<typeof features, OrderRow>();
const columns = col.columns([
  col.accessor("po_number", {
    header: "PO number",
    cell: (c) => (
      <Link href={`/orders/${c.row.original.id}`} className="font-medium whitespace-nowrap underline-offset-4 hover:underline">
        {c.getValue()}
      </Link>
    ),
  }),
  col.accessor("client_name", { header: "Client", cell: (c) => <span className="line-clamp-2">{c.getValue()}</span> }),
  col.accessor("status", {
    header: "Status",
    cell: (c) => <PoStatusBadge status={c.getValue()} />,
    sortFn: (a, b) => PO_STATUSES.indexOf(a.original.status) - PO_STATUSES.indexOf(b.original.status),
  }),
  col.accessor("days_to_due", { header: "Due", cell: (c) => <Due row={c.row.original} />, sortUndefined: "last" }),
  col.accessor("pending_value", {
    header: "Pending value",
    cell: (c) => <span className="whitespace-nowrap tabular-nums">{formatINR(c.getValue())}</span>,
    meta: { align: "right" },
  }),
  col.accessor("ld_exposure", {
    header: "LD exposure",
    cell: (c) => (
      <span className={cn("whitespace-nowrap tabular-nums", (c.getValue() ?? 0) > 0 && "text-destructive")}>
        {formatINR(c.getValue())}
      </span>
    ),
    meta: { align: "right" },
  }),
  col.display({ id: "flags", header: "Flags", cell: (c) => <PoFlags flags={poFlags(c.row.original)} /> }),
]);

const alignRight = (meta: unknown) => (meta as { align?: string } | undefined)?.align === "right";

export function OrderRegister({ rows, initialFilters }: { rows: OrderRow[]; initialFilters: OrderFilters }) {
  const [filters, setFilters] = useState(initialFilters);

  function update(next: OrderFilters) {
    setFilters(next);
    window.history.replaceState(null, "", `/orders${orderFiltersToQuery(next)}`);
  }

  function toggleStatus(s: PoStatus) {
    const statuses = filters.statuses.includes(s)
      ? filters.statuses.filter((x) => x !== s)
      : PO_STATUSES.filter((x) => x === s || filters.statuses.includes(x));
    update({ ...filters, statuses });
  }

  const counts = useMemo(() => {
    const c = {} as Record<PoStatus, number>;
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = useMemo(() => filterOrders(rows, filters), [rows, filters]);
  const table = useTable({ features, columns, data: visible });
  const sorted = table.getRowModel().rows;
  const hasFilters = filters.statuses.length > 0 || !!filters.quick || !!filters.q;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <Chip active={filters.statuses.length === 0} onClick={() => update({ ...filters, statuses: [] })}>
          All <span className="text-muted-foreground">{rows.length}</span>
        </Chip>
        {PO_STATUSES.filter((s) => counts[s]).map((s) => (
          <Chip key={s} active={filters.statuses.includes(s)} onClick={() => toggleStatus(s)}>
            {PO_STATUS_LABEL[s]} <span className="text-muted-foreground">{counts[s]}</span>
          </Chip>
        ))}
      </div>

      {filters.quick && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">From dashboard:</span>
          <button
            type="button"
            onClick={() => update({ ...filters, quick: null })}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
            aria-label={`Remove filter ${QUICK_FILTERS[filters.quick]}`}
            data-testid="quick-filter"
          >
            {QUICK_FILTERS[filters.quick]}
            <X className="size-3" />
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search orders"
          placeholder="Search PO number, client or tender ref"
          className="pl-8"
          value={filters.q}
          onChange={(e) => update({ ...filters, q: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span data-testid="order-count">
          Showing {visible.length} of {rows.length}
        </span>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => update({ statuses: [], quick: null, q: "" })}>
            Clear filters
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState>No client POs yet.</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState>No orders match these filters.</EmptyState>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                {table.getHeaderGroups().map((g) => (
                  <tr key={g.id}>
                    {g.headers.map((h) => {
                      const s = h.column.getIsSorted();
                      const right = alignRight(h.column.columnDef.meta);
                      return (
                        <th key={h.id} className={cn("px-3 py-2 font-medium", right && "text-right")}>
                          {h.column.getCanSort() ? (
                            <button
                              type="button"
                              onClick={h.column.getToggleSortingHandler()}
                              className={cn("inline-flex items-center gap-1 hover:text-foreground", right && "flex-row-reverse")}
                            >
                              <table.FlexRender header={h} />
                              {s === "asc" && <ArrowUp className="size-3" />}
                              {s === "desc" && <ArrowDown className="size-3" />}
                            </button>
                          ) : (
                            <table.FlexRender header={h} />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {sorted.map((row) => (
                  <tr key={row.id} data-testid="order-row" className="hover:bg-muted/30">
                    {row.getAllCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn("px-3 py-2 align-top", alignRight(cell.column.columnDef.meta) && "text-right")}
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-2 lg:hidden">
            {sorted.map(({ original: o }) => {
              const d = dueInfo(o.days_to_due, o.pending_qty);
              return (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    data-testid="order-card"
                    className="block space-y-2 rounded-xl border bg-card p-3 hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium whitespace-nowrap">{o.po_number}</span>
                      <PoStatusBadge status={o.status} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{o.client_name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>
                        Due {formatDate(o.effective_due)} ·{" "}
                        <span className={d.overdue ? "font-medium text-destructive" : "text-muted-foreground"}>{d.text}</span>
                      </span>
                      <span>Pending {formatINRCompact(o.pending_value)}</span>
                      {(o.ld_exposure ?? 0) > 0 && (
                        <span className="text-destructive">LD {formatINRCompact(o.ld_exposure)}</span>
                      )}
                    </div>
                    <PoFlags flags={poFlags(o)} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
