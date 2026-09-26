"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Role } from "@/lib/auth/roles";
import type {
  DiscrepancyRow,
  DispatchRow,
  ExtensionRow,
  InspectionRow,
  InvoiceBalance,
  LineRow,
  PoSummary,
  ReceiptRow,
  VendorPaymentRow,
  VendorPoRow,
} from "./types";
import { LinesTab } from "./lines-tab";
import { DiscrepanciesTab } from "./discrepancies-tab";
import { SourcingTab } from "./sourcing-tab";
import { InspectionTab } from "./inspection-tab";
import { DispatchesTab } from "./dispatches-tab";
import { ExtensionTab } from "./extension-tab";
import { InvoiceTab } from "./invoice-tab";

type Props = {
  po: PoSummary;
  role: Role | null;
  lines: LineRow[];
  discrepancies: DiscrepancyRow[];
  vendorPos: VendorPoRow[];
  vendorPayments: VendorPaymentRow[];
  inspections: InspectionRow[];
  dispatches: DispatchRow[];
  extensions: ExtensionRow[];
  invoice: InvoiceBalance | null;
  receipts: ReceiptRow[];
};

export function OrderWorkspace(p: Props) {
  const openDisc = p.discrepancies.filter((d) => !d.resolved_on).length;
  return (
    <Tabs defaultValue="lines" className="min-w-0">
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0 print:hidden">
        <TabsList>
          <TabsTrigger value="lines">Lines</TabsTrigger>
          <TabsTrigger value="discrepancies">Discrepancies{openDisc ? ` (${openDisc})` : ""}</TabsTrigger>
          <TabsTrigger value="sourcing">Sourcing</TabsTrigger>
          <TabsTrigger value="inspection">Inspection</TabsTrigger>
          <TabsTrigger value="dispatches">Dispatches ({p.dispatches.length})</TabsTrigger>
          <TabsTrigger value="extension">Extension</TabsTrigger>
          <TabsTrigger value="invoice">Invoice &amp; payments</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="lines" className="pt-3">
        <LinesTab lines={p.lines} />
      </TabsContent>
      <TabsContent value="discrepancies" className="pt-3">
        <DiscrepanciesTab po={p.po} role={p.role} discrepancies={p.discrepancies} />
      </TabsContent>
      <TabsContent value="sourcing" className="pt-3">
        <SourcingTab vendorPos={p.vendorPos} payments={p.vendorPayments} />
      </TabsContent>
      <TabsContent value="inspection" className="pt-3">
        <InspectionTab poId={p.po.id} inspections={p.inspections} />
      </TabsContent>
      <TabsContent value="dispatches" className="pt-3">
        <DispatchesTab po={p.po} lines={p.lines} dispatches={p.dispatches} />
      </TabsContent>
      <TabsContent value="extension" className="pt-3">
        <ExtensionTab po={p.po} extensions={p.extensions} />
      </TabsContent>
      <TabsContent value="invoice" className="pt-3">
        <InvoiceTab po={p.po} invoice={p.invoice} receipts={p.receipts} />
      </TabsContent>
    </Tabs>
  );
}
