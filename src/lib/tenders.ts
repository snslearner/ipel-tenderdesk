import type { Database } from "@/lib/database.types";
import type { Role } from "@/lib/auth/roles";

export type TenderStatus = Database["public"]["Enums"]["tender_status"];

export const TENDER_STATUSES: TenderStatus[] = [
  "identified",
  "evaluation",
  "preparation",
  "owner_review",
  "submitted",
  "won",
  "lost",
  "cancelled",
  "not_materialised",
];

// Tenders still in play: the bid pipeline.
export const OPEN_STATUSES: TenderStatus[] = [
  "identified",
  "evaluation",
  "preparation",
  "owner_review",
  "submitted",
];

export const STATUS_LABEL: Record<TenderStatus, string> = {
  identified: "Identified",
  evaluation: "Evaluation",
  preparation: "Preparation",
  owner_review: "Owner review",
  submitted: "Submitted",
  won: "Won",
  lost: "Lost",
  cancelled: "Cancelled",
  not_materialised: "Not materialised",
};

// Same formula as v_tender_summary.margin_pct: (bid - cost) / bid * 100, rounded to 1 decimal.
export function lineMarginPct(cost: number | null, bid: number | null): number | null {
  if (cost == null || bid == null || bid === 0) return null;
  return Math.round(((bid - cost) / bid) * 1000) / 10;
}

export type TenderAction = "send_review" | "approve" | "return" | "submit" | "won" | "lost";

// Which workflow buttons to show. The database enforces every rule; this only decides visibility.
export function tenderActions(
  status: TenderStatus,
  approved: boolean,
  role: Role | null,
): TenderAction[] {
  const owner = role === "owner";
  switch (status) {
    case "identified":
    case "evaluation":
    case "preparation":
      return ["send_review"];
    case "owner_review":
      if (!approved) return owner ? ["approve", "return"] : [];
      return owner ? ["return", "submit"] : ["submit"];
    case "submitted":
      return ["won", "lost"];
    default:
      return [];
  }
}

export function canEditItems(status: TenderStatus): boolean {
  return status === "identified" || status === "evaluation" || status === "preparation";
}

export type TenderFilters = { statuses: TenderStatus[]; client: string; q: string };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// URL shape: ?status=won,lost | ?status=open, &client=<id>, &q=<search>
export function parseTenderFilters(params: Record<string, string | string[] | undefined>): TenderFilters {
  const raw = one(params.status)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const expanded = raw.flatMap((s) => (s === "open" ? OPEN_STATUSES : [s]));
  const statuses = TENDER_STATUSES.filter((s) => expanded.includes(s));
  return { statuses, client: one(params.client).trim(), q: one(params.q).trim() };
}

type FilterableTender = { ref_no: string; title: string; client_id: string; status: TenderStatus };

// Status chips are OR-ed; client and search narrow further. Search matches ref or title.
export function filterTenders<T extends FilterableTender>(rows: T[], f: TenderFilters): T[] {
  const q = f.q.toLowerCase();
  return rows.filter(
    (r) =>
      (f.statuses.length === 0 || f.statuses.includes(r.status)) &&
      (!f.client || r.client_id === f.client) &&
      (!q || r.ref_no.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)),
  );
}

// Inverse of parseTenderFilters, for keeping the URL in sync.
export function tenderFiltersToQuery(f: TenderFilters): string {
  const p = new URLSearchParams();
  if (f.statuses.length) p.set("status", f.statuses.join(","));
  if (f.client) p.set("client", f.client);
  if (f.q) p.set("q", f.q);
  const s = p.toString();
  return s ? `?${s}` : "";
}
