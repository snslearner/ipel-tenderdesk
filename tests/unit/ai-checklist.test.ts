import { describe, expect, it } from "vitest";
import { AiChecklistSchema, buildAcceptedRows, type AiChecklist } from "@/lib/ai-checklist";

const result: AiChecklist = {
  items: [
    { part_number: "IP-0001-A", description: "Circular Connector Assembly, Type A", qty: 25, uom: "Nos" },
    { part_number: "", description: "Relay unit (part number to be confirmed)", qty: 4, uom: "Nos" },
    { part_number: "XYZ-999", description: "Unknown gasket", qty: 10, uom: "Set" },
  ],
  required_documents: ["GST certificate", "OEM authorisation"],
  submission_checklist: ["EMD enclosed", "Every page signed"],
  uncertainties: ["Line 2 has no part number"],
};

describe("AiChecklistSchema", () => {
  it("accepts the expected shape", () => {
    expect(AiChecklistSchema.safeParse(result).success).toBe(true);
  });
  it("rejects missing sections and bad quantities", () => {
    expect(AiChecklistSchema.safeParse({ items: [] }).success).toBe(false);
    const bad = { ...result, items: [{ ...result.items[0], qty: -1 }] };
    expect(AiChecklistSchema.safeParse(bad).success).toBe(false);
  });
});

describe("buildAcceptedRows", () => {
  const productsByPart = new Map([["IP-0001-A", "prod-1"]]);

  it("inserts only ticked rows, numbering lines after the existing ones", () => {
    const rows = buildAcceptedRows("t1", result, { items: [0, 2], required_documents: [1], submission_checklist: [] }, {
      startLineNo: 13,
      productsByPart,
    });
    expect(rows.items.map((i) => i.line_no)).toEqual([13, 14]);
    expect(rows.checklist).toEqual([{ tender_id: "t1", kind: "required_doc", text: "OEM authorisation", source: "ai" }]);
  });

  it("links a known part number to the product, never invents one", () => {
    const rows = buildAcceptedRows("t1", result, { items: [0, 1, 2], required_documents: [], submission_checklist: [] }, {
      startLineNo: 1,
      productsByPart,
    });
    expect(rows.items[0]).toMatchObject({ product_id: "prod-1", description: "Circular Connector Assembly, Type A" });
    // Blank part number stays blank: no product, description unchanged.
    expect(rows.items[1]).toMatchObject({ product_id: null, description: "Relay unit (part number to be confirmed)" });
    // A part number not in the master is kept in the text, not linked.
    expect(rows.items[2]).toMatchObject({ product_id: null, description: "XYZ-999 · Unknown gasket" });
    expect(rows.items.every((i) => i.tender_id === "t1")).toBe(true);
  });

  it("marks checklist rows as source ai", () => {
    const rows = buildAcceptedRows("t1", result, { items: [], required_documents: [0], submission_checklist: [0, 1] }, {
      startLineNo: 1,
      productsByPart,
    });
    expect(rows.checklist.map((c) => [c.kind, c.source])).toEqual([
      ["required_doc", "ai"],
      ["submission_check", "ai"],
      ["submission_check", "ai"],
    ]);
  });
});
