import type { Database } from "@/lib/database.types";

export type PoStatus = Database["public"]["Enums"]["po_status"];

export const PO_STATUSES: PoStatus[] = [
  "received",
  "locked",
  "acknowledged",
  "in_execution",
  "fully_delivered",
  "invoiced",
  "closed",
];

export const PO_STATUS_LABEL: Record<PoStatus, string> = {
  received: "Received",
  locked: "Locked",
  acknowledged: "Acknowledged",
  in_execution: "In execution",
  fully_delivered: "Fully delivered",
  invoiced: "Invoiced",
  closed: "Closed",
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Days to effective due, from v_po_overview.days_to_due. Overdue only while qty is pending.
export function dueInfo(daysToDue: number | null, pendingQty: number | null): { text: string; overdue: boolean } {
  if ((pendingQty ?? 0) <= 0) return { text: "Delivered", overdue: false };
  if (daysToDue == null) return { text: "—", overdue: false };
  if (daysToDue > 0) return { text: `${plural(daysToDue, "day")} left`, overdue: false };
  if (daysToDue === 0) return { text: "Due today", overdue: false };
  return { text: `${plural(-daysToDue, "day")} overdue`, overdue: true };
}

// Row shape used by the list: v_po_overview joined with invoice and vendor PO balances.
export type OrderFilterRow = {
  po_number: string;
  client_name: string;
  tender_ref: string;
  status: PoStatus;
  days_to_due: number | null;
  pending_qty: number | null;
  ld_exposure: number | null;
  extension_due: boolean | null;
  vendor_eta_late: boolean | null;
  ready_to_claim: boolean | null;
  open_discrepancies: number | null;
  invoice_received: number | null; // v_invoice_balance.received, null when no invoice
  balance_due: number | null; // v_invoice_balance.balance_due, null when no invoice
  payable_now: number; // sum of v_vendor_po_balance.payable_now for this PO
};

export type PoFlag = "Locked" | "Extension due" | "Vendor late" | "Ready to claim";

export function poFlags(r: Pick<OrderFilterRow, "status" | "extension_due" | "vendor_eta_late" | "ready_to_claim">): PoFlag[] {
  const flags: PoFlag[] = [];
  if (r.status === "locked") flags.push("Locked");
  if (r.extension_due) flags.push("Extension due");
  if (r.vendor_eta_late) flags.push("Vendor late");
  if (r.ready_to_claim) flags.push("Ready to claim");
  return flags;
}

export const QUICK_FILTERS = {
  active: "Order book",
  due_45d: "Due in 45 days",
  overdue: "Overdue",
  ld: "LD exposure",
  locked: "Locked",
  extension_due: "Extension due",
  ready_to_claim: "Ready to claim",
  receivables: "Receivables",
  payables: "Payables",
} as const;
export type QuickFilter = keyof typeof QUICK_FILTERS;

const INACTIVE: PoStatus[] = ["closed", "invoiced", "fully_delivered"];

// Same conditions as the v_dashboard_kpis columns the dashboard cards link from.
export function matchesQuickFilter(r: OrderFilterRow, f: QuickFilter): boolean {
  const pending = (r.pending_qty ?? 0) > 0;
  const days = r.days_to_due ?? Number.NaN;
  switch (f) {
    case "active":
      return !INACTIVE.includes(r.status);
    case "due_45d":
      return pending && days >= 0 && days <= 45;
    case "overdue":
      return pending && days < 0;
    case "ld":
      return r.status !== "closed" && pending && (r.ld_exposure ?? 0) > 0;
    case "locked":
      return r.status === "locked";
    case "extension_due":
      return !!r.extension_due;
    case "ready_to_claim":
      return !!r.ready_to_claim && r.status === "invoiced" && r.invoice_received === 0;
    case "receivables":
      return (r.balance_due ?? 0) > 0;
    case "payables":
      return r.payable_now > 0;
  }
}

export type OrderFilters = { statuses: PoStatus[]; quick: QuickFilter | null; q: string };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseOrderFilters(params: Record<string, string | string[] | undefined>): OrderFilters {
  const raw = one(params.status).split(",").map((s) => s.trim());
  const quick = one(params.filter).trim();
  return {
    statuses: PO_STATUSES.filter((s) => raw.includes(s)),
    quick: quick in QUICK_FILTERS ? (quick as QuickFilter) : null,
    q: one(params.q).trim(),
  };
}

export function orderFiltersToQuery(f: OrderFilters): string {
  const p = new URLSearchParams();
  if (f.statuses.length) p.set("status", f.statuses.join(","));
  if (f.quick) p.set("filter", f.quick);
  if (f.q) p.set("q", f.q);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function filterOrders<T extends OrderFilterRow>(rows: T[], f: OrderFilters): T[] {
  const q = f.q.toLowerCase();
  return rows.filter(
    (r) =>
      (f.statuses.length === 0 || f.statuses.includes(r.status)) &&
      (!f.quick || matchesQuickFilter(r, f.quick)) &&
      (!q ||
        r.po_number.toLowerCase().includes(q) ||
        r.client_name.toLowerCase().includes(q) ||
        r.tender_ref.toLowerCase().includes(q)),
  );
}

export type ChecklistEntry = { label: string; done: boolean; note?: string };

const DC_LABEL = "Signed/sealed/stamped delivery challans";

// Full claim checklist from v_po_overview.payment_docs_missing (which lists only what is missing).
export function paymentChecklist(missing: string[]): ChecklistEntry[] {
  const noDcs = missing.includes("Delivery challans");
  return [
    { label: "Bid copy", done: !missing.includes("Bid copy") },
    { label: "Purchase order", done: !missing.includes("Purchase order") },
    { label: "Invoice", done: !missing.includes("Invoice") },
    noDcs
      ? { label: DC_LABEL, done: false, note: "No delivery challans yet" }
      : { label: DC_LABEL, done: !missing.includes(DC_LABEL) },
  ];
}
