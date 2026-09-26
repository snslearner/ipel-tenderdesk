import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { expiryState, todayIST } from "@/lib/format";
import { VendorList, type VendorRow } from "@/components/masters/vendor-list";

export const metadata: Metadata = { title: "Vendors · IPEL TenderDesk" };

export default async function VendorsPage({ searchParams }: PageProps<"/vendors">) {
  const { type } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, type, city, specialisation, iso_certified, quality_rating, vendor_certificates(valid_until)")
    .order("name");
  if (error) throw new Error(`Could not load vendors: ${error.message}`);

  const today = todayIST();
  const rows: VendorRow[] = data.map((v) => ({
    id: v.id,
    name: v.name,
    type: v.type,
    city: v.city,
    specialisation: v.specialisation,
    iso_certified: v.iso_certified,
    quality_rating: v.quality_rating,
    certs_expiring: v.vendor_certificates.filter((c) => {
      const s = expiryState(c.valid_until, today);
      return s === "soon" || s === "expired";
    }).length,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Vendors</h1>
      <VendorList rows={rows} initialType={typeof type === "string" ? type : ""} />
    </div>
  );
}
