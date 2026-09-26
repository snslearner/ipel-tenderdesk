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

export type TenderView = "list" | "board";
export type TenderFilters = { statuses: TenderStatus[]; client: string; source: TenderSource | ""; q: string; view: TenderView };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// URL shape: ?status=won,lost | ?status=open, &client=<id>, &source=<source>, &q=<search>, &view=board
export function parseTenderFilters(params: Record<string, string | string[] | undefined>): TenderFilters {
  const raw = one(params.status)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const expanded = raw.flatMap((s) => (s === "open" ? OPEN_STATUSES : [s]));
  const statuses = TENDER_STATUSES.filter((s) => expanded.includes(s));
  const source = one(params.source).trim();
  return {
    statuses,
    client: one(params.client).trim(),
    source: source in SOURCE_LABEL ? (source as TenderSource) : "",
    q: one(params.q).trim(),
    view: one(params.view) === "board" ? "board" : "list",
  };
}

type FilterableTender = { ref_no: string; title: string; client_id: string; status: TenderStatus; source: TenderSource };

// Status chips are OR-ed; client, source and search narrow further. Search matches ref or title.
export function filterTenders<T extends FilterableTender>(rows: T[], f: TenderFilters): T[] {
  const q = f.q.toLowerCase();
  return rows.filter(
    (r) =>
      (f.statuses.length === 0 || f.statuses.includes(r.status)) &&
      (!f.client || r.client_id === f.client) &&
      (!f.source || r.source === f.source) &&
      (!q || r.ref_no.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)),
  );
}

// Inverse of parseTenderFilters, for keeping the URL in sync.
export function tenderFiltersToQuery(f: TenderFilters): string {
  const p = new URLSearchParams();
  if (f.statuses.length) p.set("status", f.statuses.join(","));
  if (f.client) p.set("client", f.client);
  if (f.source) p.set("source", f.source);
  if (f.q) p.set("q", f.q);
  if (f.view === "board") p.set("view", "board");
  const s = p.toString();
  return s ? `?${s}` : "";
}

export type TenderSource = Database["public"]["Enums"]["tender_source"];

export const SOURCE_LABEL: Record<TenderSource, string> = {
  phone_call: "Phone call",
  whatsapp: "WhatsApp",
  referral: "Referral",
  client_email: "Email",
  client_portal: "Portal",
  defence_portal: "Defence portal",
  gem: "GeM",
  cppp: "CPPP",
};

// Offered on "New enquiry": direct leads first. ("Portal" = the client's own portal.)
export const ENQUIRY_SOURCES: TenderSource[] = ["phone_call", "whatsapp", "referral", "client_email", "client_portal", "gem", "cppp"];

// How to follow up a lead, by where it came from.
export function followUpChannel(source: TenderSource): "call" | "email" {
  return source === "phone_call" || source === "whatsapp" || source === "referral" ? "call" : "email";
}

// Pipeline board columns (cancelled / not materialised stay in the list view).
export const BOARD_STATUSES: TenderStatus[] = ["identified", "evaluation", "preparation", "owner_review", "submitted", "won", "lost"];

const NEXT: Partial<Record<TenderStatus, TenderStatus>> = {
  identified: "evaluation",
  evaluation: "preparation",
  preparation: "owner_review",
  owner_review: "submitted",
};

// One step forward; after submission the result (won / lost) is chosen explicitly.
export function nextStage(status: TenderStatus): TenderStatus | null {
  return NEXT[status] ?? null;
}

// Internal reference for a new enquiry until the client's tender number is known.
export function enquiryRef(now: Date = new Date(), random: () => number = Math.random): string {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "2-digit", month: "2-digit", day: "2-digit" })
    .format(now)
    .replace(/-/g, "");
  const suffix = Math.floor(random() * 36 ** 4).toString(36).toUpperCase().padStart(4, "0");
  return `ENQ-${d}-${suffix}`;
}
