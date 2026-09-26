import { Badge } from "@/components/ui/badge";
import { formatDate, formatINR } from "@/lib/format";

export type GuaranteeRow = {
  id: string;
  kind: "emd" | "pbg";
  bank_name: string;
  bg_number: string;
  amount: number;
  issued_on: string | null;
  valid_until: string | null;
  status: "active" | "released" | "invoked" | "expired";
};

export function GuaranteesTab({ guarantees }: { guarantees: GuaranteeRow[] }) {
  if (guarantees.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No bank guarantees for this tender.
      </div>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {guarantees.map((g) => (
        <li key={g.id} className="space-y-1 rounded-xl border bg-card p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">
              {g.kind.toUpperCase()} · {g.bg_number}
            </span>
            <Badge variant={g.status === "active" ? "default" : "outline"} className="capitalize">
              {g.status}
            </Badge>
          </div>
          <p className="truncate text-muted-foreground">{g.bank_name}</p>
          <p className="tabular-nums">{formatINR(g.amount)}</p>
          <p className="text-xs text-muted-foreground">
            Issued {formatDate(g.issued_on)} · valid until {formatDate(g.valid_until)}
          </p>
        </li>
      ))}
    </ul>
  );
}
