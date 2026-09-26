import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  sub?: ReactNode;
  href: string;
  tone?: "default" | "alert";
  testId?: string;
};

// Whole card is a link to the list behind the number.
export function KpiCard({ label, value, sub, href, tone = "default", testId }: Props) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="group flex min-w-0 flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span className="flex items-start justify-between gap-2 text-sm text-muted-foreground">
        <span className="min-w-0">{label}</span>
        <ChevronRight className="mt-0.5 size-4 shrink-0 opacity-50 group-hover:opacity-100" />
      </span>
      <span
        data-slot="kpi-value"
        className={cn("truncate text-2xl font-semibold tracking-tight", tone === "alert" && "text-destructive")}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </Link>
  );
}
