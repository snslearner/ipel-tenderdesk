import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { parseTenderFilters } from "@/lib/tenders";
import { TenderRegister, type TenderRow } from "@/components/tenders/tender-register";
import { NewEnquiryButton } from "@/components/crm/new-enquiry-dialog";

export const metadata: Metadata = { title: "Tenders · IPEL TenderDesk" };

export default async function TendersPage({ searchParams }: PageProps<"/tenders">) {
  const filters = parseTenderFilters(await searchParams);
  const supabase = await createClient();
  const [tenderRes, clientRes] = await Promise.all([
    supabase
      .from("v_tender_summary")
      .select("id, ref_no, title, client_id, client_name, status, source, submission_due, total_bid, margin_pct")
      .order("submission_due", { ascending: false, nullsFirst: false }),
    supabase.from("clients").select("id, name").order("name"),
  ]);
  if (tenderRes.error) throw new Error(`Could not load tenders: ${tenderRes.error.message}`);
  if (clientRes.error) throw new Error(`Could not load clients: ${clientRes.error.message}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Tenders</h1>
        <NewEnquiryButton clients={clientRes.data} />
      </div>
      <TenderRegister
        rows={tenderRes.data as TenderRow[]}
        clients={clientRes.data}
        initialFilters={filters}
      />
    </div>
  );
}
