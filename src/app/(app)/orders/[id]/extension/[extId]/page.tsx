import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/orders/print-button";

export const metadata: Metadata = { title: "Extension letter · IPEL TenderDesk" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Print-friendly letter: the app shell and these controls are hidden when printing.
export default async function ExtensionLetterPage({ params }: PageProps<"/orders/[id]/extension/[extId]">) {
  const { id, extId } = await params;
  if (!UUID.test(id) || !UUID.test(extId)) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("extension_requests")
    .select("letter_text, status, client_pos(po_number)")
    .eq("id", extId)
    .eq("client_po_id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load letter: ${error.message}`);
  if (!data?.letter_text) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/orders/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> {data.client_pos?.po_number ?? "Order"}
        </Link>
        <PrintButton />
      </div>
      <p className="text-xs text-muted-foreground print:hidden">
        Draft ({data.status}). Review before printing; use the browser&apos;s Save as PDF. Nothing is emailed.
      </p>
      <article
        data-testid="print-letter"
        className="rounded-lg border bg-white p-6 font-serif text-sm leading-relaxed whitespace-pre-wrap text-black sm:p-10 print:rounded-none print:border-0 print:p-0"
      >
        {data.letter_text}
      </article>
    </div>
  );
}
