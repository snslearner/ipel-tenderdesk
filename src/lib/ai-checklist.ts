import { z } from "zod";

// JSON contract for /api/ai/tender-checklist (from CLAUDE.md "AI CHECKLIST").
export const AiChecklistSchema = z.object({
  items: z.array(
    z.object({
      part_number: z.string(), // "" when the PDF does not show one: never invented
      description: z.string(),
      qty: z.number().nonnegative(),
      uom: z.string(),
    }),
  ),
  required_documents: z.array(z.string()),
  submission_checklist: z.array(z.string()),
  uncertainties: z.array(z.string()),
});
export type AiChecklist = z.infer<typeof AiChecklistSchema>;

export const AI_SYSTEM_PROMPT = `You read Indian defence tender documents for IPEL Ltd, the bidder.
Return JSON only, matching the schema you are given, with four arrays:
- items: every line in the schedule of requirements, in document order, with part_number, description, qty and uom exactly as written.
- required_documents: every document the bidder must submit.
- submission_checklist: every action the bidder must complete to submit a valid bid (EMD, signatures, uploads, undertakings, validity).
- uncertainties: anything unclear or missing that a person should check.

Never invent a part number. If the document does not show one for a line (blank, "-", "to be confirmed"), set part_number to "" and add an entry to uncertainties naming that line.
If a quantity or unit is unreadable, use qty 0 or uom "" and list it in uncertainties. Do not guess.`;

export type Selection = { items: number[]; required_documents: number[]; submission_checklist: number[] };

type ItemInsert = {
  tender_id: string;
  line_no: number;
  product_id: string | null;
  description: string;
  qty: number;
  uom: string;
};
type ChecklistInsert = {
  tender_id: string;
  kind: "required_doc" | "submission_check";
  text: string;
  source: "ai";
};

// Turns the rows a person ticked into insert rows. Only ticked rows are returned.
export function buildAcceptedRows(
  tenderId: string,
  result: AiChecklist,
  selected: Selection,
  { startLineNo, productsByPart }: { startLineNo: number; productsByPart: Map<string, string> },
): { items: ItemInsert[]; checklist: ChecklistInsert[] } {
  const items = selected.items.map((idx, n) => {
    const it = result.items[idx];
    const part = it.part_number.trim();
    const productId = part ? (productsByPart.get(part) ?? null) : null;
    return {
      tender_id: tenderId,
      line_no: startLineNo + n,
      product_id: productId,
      // tender_items has no part-number column: an unmatched part number is kept in the text.
      description: part && !productId ? `${part} · ${it.description}` : it.description,
      qty: it.qty,
      uom: it.uom || "Nos",
    };
  });
  const checklist: ChecklistInsert[] = [
    ...selected.required_documents.map((i) => ({
      tender_id: tenderId,
      kind: "required_doc" as const,
      text: result.required_documents[i],
      source: "ai" as const,
    })),
    ...selected.submission_checklist.map((i) => ({
      tender_id: tenderId,
      kind: "submission_check" as const,
      text: result.submission_checklist[i],
      source: "ai" as const,
    })),
  ];
  return { items, checklist };
}
