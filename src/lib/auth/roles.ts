export const ROLES = ["owner", "tender", "purchase", "accounts", "logistics"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

const LABELS: Record<Role, string> = {
  owner: "Owner",
  tender: "Tender",
  purchase: "Purchase",
  accounts: "Accounts",
  logistics: "Logistics",
};

export function roleLabel(value: unknown): string {
  return isRole(value) ? LABELS[value] : "No role";
}
