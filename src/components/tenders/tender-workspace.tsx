"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TenderStatus } from "@/lib/tenders";
import { ItemsTab, type ItemRow, type VendorOption } from "./items-tab";
import { ChecklistTab, type ChecklistRow } from "./checklist-tab";
import { GuaranteesTab, type GuaranteeRow } from "./guarantees-tab";
import { HistoryTab, type HistoryRow } from "./history-tab";

type Props = {
  status: TenderStatus;
  items: ItemRow[];
  checklist: ChecklistRow[];
  guarantees: GuaranteeRow[];
  vendors: VendorOption[];
  history: HistoryRow[];
};

export function TenderWorkspace({ status, items, checklist, guarantees, vendors, history }: Props) {
  const open = checklist.filter((c) => !c.done).length;
  return (
    <Tabs defaultValue="items" className="min-w-0">
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <TabsList>
          <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="checklist">Checklist{open ? ` (${open} open)` : ""}</TabsTrigger>
          <TabsTrigger value="guarantees">Guarantees ({guarantees.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="items" className="pt-3">
        <ItemsTab status={status} items={items} vendors={vendors} />
      </TabsContent>
      <TabsContent value="checklist" className="pt-3">
        <ChecklistTab items={checklist} />
      </TabsContent>
      <TabsContent value="guarantees" className="pt-3">
        <GuaranteesTab guarantees={guarantees} />
      </TabsContent>
      <TabsContent value="history" className="pt-3">
        <HistoryTab items={items} history={history} />
      </TabsContent>
    </Tabs>
  );
}
