import { Badge } from "@/components/ui/badge";
import { PO_STATUS_LABEL, type PoFlag, type PoStatus } from "@/lib/orders";

const VARIANT: Record<PoStatus, "default" | "secondary" | "outline" | "destructive"> = {
  received: "outline",
  locked: "destructive",
  acknowledged: "secondary",
  in_execution: "default",
  fully_delivered: "secondary",
  invoiced: "secondary",
  closed: "outline",
};

export function PoStatusBadge({ status }: { status: PoStatus }) {
  return (
    <Badge variant={VARIANT[status]} data-testid="po-status">
      {PO_STATUS_LABEL[status]}
    </Badge>
  );
}

const FLAG_CLASS: Record<PoFlag, string> = {
  Locked: "border-destructive/40 text-destructive",
  "Extension due": "border-amber-500/50 text-amber-700",
  "Vendor late": "border-destructive/40 text-destructive",
  "Ready to claim": "border-emerald-600/40 text-emerald-700",
};

export function PoFlags({ flags }: { flags: PoFlag[] }) {
  if (flags.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1" data-testid="po-flags">
      {flags.map((f) => (
        <Badge key={f} variant="outline" className={FLAG_CLASS[f]}>
          {f}
        </Badge>
      ))}
    </span>
  );
}
