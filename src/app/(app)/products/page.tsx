import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductList } from "@/components/masters/product-list";

export const metadata: Metadata = { title: "Products · IPEL TenderDesk" };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, part_number, name, spec, standard, uom")
    .order("part_number");
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Products</h1>
      <ProductList rows={data} initialQuery={typeof q === "string" ? q : ""} />
    </div>
  );
}
