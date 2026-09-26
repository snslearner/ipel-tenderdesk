import { describe, expect, it } from "vitest";
import {
  PO_STATUSES,
  dueInfo,
  filterOrders,
  matchesQuickFilter,
  parseOrderFilters,
  orderFiltersToQuery,
  paymentChecklist,
  poFlags,
  type OrderFilterRow,
} from "@/lib/orders";

const row = (x: Partial<OrderFilterRow> = {}): OrderFilterRow => ({
  po_number: "PO/X/2026/1",
  client_name: "Client",
  tender_ref: "TND-1",
  status: "in_execution",
  days_to_due: 10,
  pending_qty: 5,
  ld_exposure: 0,
  extension_due: false,
  vendor_eta_late: false,
  ready_to_claim: false,
  open_discrepancies: 0,
  invoice_received: null,
  balance_due: null,
  payable_now: 0,
  ...x,
});

describe("dueInfo", () => {
  it("counts days left, today, and overdue only while qty is pending", () => {
    expect(dueInfo(15, 10)).toEqual({ text: "15 days left", overdue: false });
    expect(dueInfo(1, 10)).toEqual({ text: "1 day left", overdue: false });
    expect(dueInfo(0, 10)).toEqual({ text: "Due today", overdue: false });
    expect(dueInfo(-25, 10)).toEqual({ text: "25 days overdue", overdue: true });
    expect(dueInfo(-1, 10)).toEqual({ text: "1 day overdue", overdue: true });
  });
  it("is never overdue once fully delivered", () => {
    expect(dueInfo(-40, 0)).toEqual({ text: "Delivered", overdue: false });
    expect(dueInfo(null, 3)).toEqual({ text: "—", overdue: false });
  });
});

describe("poFlags", () => {
  it("maps the view booleans to labels", () => {
    expect(poFlags(row())).toEqual([]);
    expect(
      poFlags(row({ status: "locked", extension_due: true, vendor_eta_late: true, ready_to_claim: true })),
    ).toEqual(["Locked", "Extension due", "Vendor late", "Ready to claim"]);
  });
});

// Each quick filter must use the same condition as the matching v_dashboard_kpis column,
// so the list length equals the number on the dashboard card.
describe("matchesQuickFilter mirrors v_dashboard_kpis", () => {
  it("active = order book (not closed/invoiced/fully delivered)", () => {
    expect(matchesQuickFilter(row({ status: "locked" }), "active")).toBe(true);
    expect(matchesQuickFilter(row({ status: "invoiced" }), "active")).toBe(false);
  });
  it("due_45d = pending and 0..45 days to due", () => {
    expect(matchesQuickFilter(row({ days_to_due: 0 }), "due_45d")).toBe(true);
    expect(matchesQuickFilter(row({ days_to_due: 45 }), "due_45d")).toBe(true);
    expect(matchesQuickFilter(row({ days_to_due: 46 }), "due_45d")).toBe(false);
    expect(matchesQuickFilter(row({ days_to_due: 10, pending_qty: 0 }), "due_45d")).toBe(false);
  });
  it("overdue = pending and past due", () => {
    expect(matchesQuickFilter(row({ days_to_due: -1 }), "overdue")).toBe(true);
    expect(matchesQuickFilter(row({ days_to_due: -1, pending_qty: 0 }), "overdue")).toBe(false);
  });
  it("ld = open, pending, with exposure", () => {
    expect(matchesQuickFilter(row({ ld_exposure: 10 }), "ld")).toBe(true);
    expect(matchesQuickFilter(row({ ld_exposure: 10, status: "closed" }), "ld")).toBe(false);
    expect(matchesQuickFilter(row({ ld_exposure: 0 }), "ld")).toBe(false);
  });
  it("ready_to_claim = flag, invoiced, nothing received yet", () => {
    const base = { ready_to_claim: true, status: "invoiced" as const };
    expect(matchesQuickFilter(row({ ...base, invoice_received: 0 }), "ready_to_claim")).toBe(true);
    expect(matchesQuickFilter(row({ ...base, invoice_received: 5 }), "ready_to_claim")).toBe(false);
    expect(matchesQuickFilter(row({ ...base, status: "closed", invoice_received: 0 }), "ready_to_claim")).toBe(false);
  });
  it("receivables and payables", () => {
    expect(matchesQuickFilter(row({ balance_due: 100 }), "receivables")).toBe(true);
    expect(matchesQuickFilter(row({ balance_due: 0 }), "receivables")).toBe(false);
    expect(matchesQuickFilter(row({ payable_now: 1 }), "payables")).toBe(true);
    expect(matchesQuickFilter(row({ payable_now: 0 }), "payables")).toBe(false);
  });
  it("locked and extension_due", () => {
    expect(matchesQuickFilter(row({ status: "locked" }), "locked")).toBe(true);
    expect(matchesQuickFilter(row({ extension_due: true }), "extension_due")).toBe(true);
  });
});

describe("order filters", () => {
  it("parse status, quick filter and search; drop unknowns", () => {
    expect(parseOrderFilters({ status: "locked,bogus", filter: "overdue", q: " 1020 " })).toEqual({
      statuses: ["locked"],
      quick: "overdue",
      q: "1020",
    });
    expect(parseOrderFilters({ filter: "nope" })).toEqual({ statuses: [], quick: null, q: "" });
  });
  it("round-trip through the URL", () => {
    const f = { statuses: ["invoiced" as const], quick: "receivables" as const, q: "ads" };
    expect(parseOrderFilters(Object.fromEntries(new URLSearchParams(orderFiltersToQuery(f))))).toEqual(f);
  });
  it("filter by status, quick filter and search over PO, client and tender ref", () => {
    const rows = [
      row({ po_number: "PO/DMSP/2026/1020", status: "locked" }),
      row({ po_number: "PO/ADS/2025/1003", status: "invoiced", client_name: "Naval Stores" }),
      row({ po_number: "PO/KPI/2026/1014", days_to_due: -10, tender_ref: "TND-2025-014" }),
    ];
    const f = (x: object) => ({ statuses: [], quick: null, q: "", ...x });
    expect(filterOrders(rows, f({ statuses: ["locked"] })).map((r) => r.po_number)).toEqual(["PO/DMSP/2026/1020"]);
    expect(filterOrders(rows, f({ quick: "overdue" })).map((r) => r.po_number)).toEqual(["PO/KPI/2026/1014"]);
    expect(filterOrders(rows, f({ q: "naval" })).map((r) => r.po_number)).toEqual(["PO/ADS/2025/1003"]);
    expect(filterOrders(rows, f({ q: "tnd-2025-014" }))).toHaveLength(1);
  });
  it("knows every PO status", () => {
    expect(PO_STATUSES).toHaveLength(7);
  });
});

describe("paymentChecklist", () => {
  it("lists all four claim documents and ticks what is on file", () => {
    expect(paymentChecklist([])).toEqual([
      { label: "Bid copy", done: true },
      { label: "Purchase order", done: true },
      { label: "Invoice", done: true },
      { label: "Signed/sealed/stamped delivery challans", done: true },
    ]);
    const missing = paymentChecklist(["Invoice", "Signed/sealed/stamped delivery challans"]);
    expect(missing.filter((c) => !c.done).map((c) => c.label)).toEqual([
      "Invoice",
      "Signed/sealed/stamped delivery challans",
    ]);
  });
  it("treats 'Delivery challans' (none yet) as the challan item missing", () => {
    expect(paymentChecklist(["Delivery challans"])[3]).toEqual({
      label: "Signed/sealed/stamped delivery challans",
      done: false,
      note: "No delivery challans yet",
    });
  });
});
