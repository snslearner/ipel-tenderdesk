import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type TenderStatus } from "@/lib/tenders";

const VARIANT: Record<TenderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  identified: "outline",
  evaluation: "outline",
  preparation: "secondary",
  owner_review: "default",
  submitted: "secondary",
  won: "default",
  lost: "destructive",
  cancelled: "outline",
  not_materialised: "outline",
};

export function StatusBadge({ status }: { status: TenderStatus }) {
  return (
    <Badge variant={VARIANT[status]} data-testid="tender-status">
      {STATUS_LABEL[status]}
    </Badge>
  );
}
