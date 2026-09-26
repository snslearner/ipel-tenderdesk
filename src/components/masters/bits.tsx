import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, Star } from "lucide-react";
import type { Database } from "@/lib/database.types";

export type VendorType = Database["public"]["Enums"]["vendor_type"];
export const VENDOR_TYPE_LABEL: Record<VendorType, string> = { oem: "OEM", supplier: "Supplier", subcontractor: "Subcontractor" };

export type ClientType = Database["public"]["Enums"]["client_type"];
export const CLIENT_TYPE_LABEL: Record<ClientType, string> = { defence_wing: "Defence wing", dpsu: "DPSU", private_mfr: "Private manufacturer" };

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ChevronLeft className="size-4" /> {children}
    </Link>
  );
}

export function Section({ title, children, testId }: { title: string; children: ReactNode; testId?: string }) {
  return (
    <section className="space-y-2" data-testid={testId}>
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{children}</dd>
    </div>
  );
}

export function Rating({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted-foreground">Not rated</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Quality rating ${value} of 5`} title={`${value} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`size-3.5 ${i < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}
