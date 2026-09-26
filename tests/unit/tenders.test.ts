import { describe, expect, it } from "vitest";
import {
  OPEN_STATUSES,
  TENDER_STATUSES,
  canEditItems,
  filterTenders,
  tenderFiltersToQuery,
  type TenderFilters,
  lineMarginPct,
  parseTenderFilters,
  tenderActions,
} from "@/lib/tenders";

describe("lineMarginPct", () => {
  // Same formula as v_tender_summary.margin_pct: (bid - cost) / bid * 100, 1 decimal.
  it("matches the view formula", () => {
    expect(lineMarginPct(3195037.03, 3603243.77)).toBe(11.3);
    expect(lineMarginPct(7685.88, 8478.83)).toBe(9.4);
  });
  it("is null when cost or bid is missing or bid is zero", () => {
    expect(lineMarginPct(null, 100)).toBeNull();
    expect(lineMarginPct(100, null)).toBeNull();
    expect(lineMarginPct(100, 0)).toBeNull();
  });
  it("can be negative", () => {
    expect(lineMarginPct(110, 100)).toBe(-10);
  });
});

describe("tenderActions", () => {
  it("offers Send for owner review before review", () => {
    for (const s of ["identified", "evaluation", "preparation"] as const) {
      expect(tenderActions(s, false, "tender")).toEqual(["send_review"]);
    }
  });

  it("shows Approve and Return to the owner only", () => {
    expect(tenderActions("owner_review", false, "owner")).toEqual(["approve", "return"]);
    for (const role of ["tender", "purchase", "accounts", "logistics", null] as const) {
      expect(tenderActions("owner_review", false, role)).toEqual([]);
    }
  });

  it("offers Submit once approved, to anyone", () => {
    expect(tenderActions("owner_review", true, "owner")).toEqual(["return", "submit"]);
    expect(tenderActions("owner_review", true, "tender")).toEqual(["submit"]);
  });

  it("offers won/lost after submission and nothing after a result", () => {
    expect(tenderActions("submitted", true, "tender")).toEqual(["won", "lost"]);
    for (const s of ["won", "lost", "cancelled", "not_materialised"] as const) {
      expect(tenderActions(s, true, "owner")).toEqual([]);
    }
  });
});

describe("canEditItems", () => {
  it("allows line edits only before owner review", () => {
    expect(canEditItems("preparation")).toBe(true);
    expect(canEditItems("identified")).toBe(true);
    expect(canEditItems("owner_review")).toBe(false);
    expect(canEditItems("won")).toBe(false);
  });
});

describe("parseTenderFilters", () => {
  it("reads status list, client and search from the URL", () => {
    expect(
      parseTenderFilters({ status: "won,lost", client: "abc", q: " radiator " }),
    ).toEqual({ statuses: ["won", "lost"], client: "abc", source: "", q: "radiator", view: "list" });
  });
  it("expands 'open' and drops unknown statuses", () => {
    expect(parseTenderFilters({ status: "open,bogus" }).statuses).toEqual(OPEN_STATUSES);
  });
  it("defaults to no filters", () => {
    expect(parseTenderFilters({})).toEqual({ statuses: [], client: "", source: "", q: "", view: "list" });
  });
  it("reads source and board view, ignoring unknown sources", () => {
    expect(parseTenderFilters({ source: "whatsapp", view: "board" })).toMatchObject({ source: "whatsapp", view: "board" });
    expect(parseTenderFilters({ source: "fax" }).source).toBe("");
  });
  it("knows every database status", () => {
    expect(TENDER_STATUSES).toHaveLength(9);
  });
});

describe("filterTenders", () => {
  const rows = [
    { ref_no: "TND-1", title: "Supply of Radiator Core", client_id: "a", status: "won" as const, source: "gem" as const },
    { ref_no: "TND-2", title: "Supply of Gear Pump", client_id: "b", status: "lost" as const, source: "whatsapp" as const },
    { ref_no: "TND-3", title: "Radiator hoses", client_id: "b", status: "owner_review" as const, source: "whatsapp" as const },
  ];
  const f = (x: Partial<TenderFilters>): TenderFilters => ({ statuses: [], client: "", source: "", q: "", view: "list", ...x });

  it("returns everything with no filters", () => {
    expect(filterTenders(rows, f({}))).toHaveLength(3);
  });
  it("ORs status chips", () => {
    expect(filterTenders(rows, f({ statuses: ["won", "lost"] })).map((r) => r.ref_no)).toEqual(["TND-1", "TND-2"]);
  });
  it("ANDs client and case-insensitive search on ref or title", () => {
    expect(filterTenders(rows, f({ client: "b", q: "RADIATOR" })).map((r) => r.ref_no)).toEqual(["TND-3"]);
    expect(filterTenders(rows, f({ q: "tnd-2" })).map((r) => r.ref_no)).toEqual(["TND-2"]);
  });
  it("filters by source", () => {
    expect(filterTenders(rows, f({ source: "whatsapp" })).map((r) => r.ref_no)).toEqual(["TND-2", "TND-3"]);
  });
  it("round-trips through the URL query", () => {
    const x = f({ statuses: ["won", "lost"], client: "b", source: "referral", q: "gear pump", view: "board" });
    const q = tenderFiltersToQuery(x);
    expect(parseTenderFilters(Object.fromEntries(new URLSearchParams(q)))).toEqual(x);
    expect(tenderFiltersToQuery(f({}))).toBe("");
  });
});
