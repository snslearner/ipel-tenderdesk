"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/list-bits";
import { createClient } from "@/lib/supabase/client";
import { formatDate, todayIST } from "@/lib/format";
import type { Database } from "@/lib/database.types";
import { useDbAction } from "@/components/use-db-action";
import type { InspectionRow } from "./types";

type Agency = Database["public"]["Enums"]["inspection_agency"];
type Result = Database["public"]["Enums"]["inspection_result"];

const AGENCY: Record<Agency, string> = { dgqa: "DGQA", buyer_qa: "Buyer QA", third_party: "Third party" };
const RESULT: Record<Result, string> = { pending: "Pending", passed: "Passed", failed: "Failed" };
const selectClass = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function InspectionTab({ poId, inspections }: { poId: string; inspections: InspectionRow[] }) {
  const { pending, run } = useDbAction();
  const [form, setForm] = useState({ agency: "dgqa" as Agency, called_on: todayIST(), scheduled_on: "", result: "pending" as Result, remarks: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      {inspections.length === 0 ? (
        <EmptyState>No inspection called yet.</EmptyState>
      ) : (
        <ul className="space-y-2" data-testid="inspections">
          {inspections.map((i) => (
            <li key={i.id} className="space-y-1 rounded-xl border bg-card p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{AGENCY[i.agency]}</span>
                <Badge variant={i.result === "failed" ? "destructive" : i.result === "passed" ? "default" : "outline"}>
                  {RESULT[i.result]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Called {formatDate(i.called_on)} · scheduled {formatDate(i.scheduled_on)}
              </p>
              {i.remarks && <p className="text-xs break-words">{i.remarks}</p>}
            </li>
          ))}
        </ul>
      )}

      <form
        className="space-y-3 rounded-xl border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            "Inspection added",
            () =>
              createClient().from("inspections").insert({
                client_po_id: poId,
                agency: form.agency,
                called_on: form.called_on || null,
                scheduled_on: form.scheduled_on || null,
                result: form.result,
                remarks: form.remarks.trim() || null,
              }),
            () => setForm((f) => ({ ...f, scheduled_on: "", remarks: "" })),
          );
        }}
      >
        <p className="text-sm font-medium">Add inspection</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="insp-agency">Agency</Label>
            <select id="insp-agency" className={selectClass} value={form.agency} onChange={set("agency")}>
              {Object.entries(AGENCY).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="insp-called">Called on</Label>
            <Input id="insp-called" type="date" value={form.called_on} onChange={set("called_on")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="insp-scheduled">Scheduled on</Label>
            <Input id="insp-scheduled" type="date" value={form.scheduled_on} onChange={set("scheduled_on")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="insp-result">Result</Label>
            <select id="insp-result" className={selectClass} value={form.result} onChange={set("result")}>
              {Object.entries(RESULT).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="insp-remarks">Remarks</Label>
          <Input id="insp-remarks" value={form.remarks} onChange={set("remarks")} />
        </div>
        <Button type="submit" disabled={pending}>
          Add inspection
        </Button>
      </form>
    </div>
  );
}
