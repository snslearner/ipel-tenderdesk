"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { ENQUIRY_SOURCES, SOURCE_LABEL, enquiryRef, type TenderSource } from "@/lib/tenders";
import { CLIENT_TYPE_LABEL, type ClientType } from "@/components/masters/bits";

const NEW = "__new__";
const selectClass = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";
const EMPTY = { clientId: "", newName: "", newType: "private_mfr" as ClientType, title: "", source: "phone_call" as TenderSource, due: "" };

export function NewEnquiryButton({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isNew = f.clientId === NEW;

  function submit() {
    if (!f.clientId) return setErr("Pick a customer or add a new one");
    if (isNew && f.newName.trim().length < 2) return setErr("Enter the new customer's name");
    if (f.title.trim().length < 3) return setErr("Enter what the customer needs");
    setErr(null);
    const supabase = createClient();
    startTransition(async () => {
      let clientId = f.clientId;
      if (isNew) {
        const c = await supabase.from("clients").insert({ name: f.newName.trim(), type: f.newType }).select("id").single();
        if (c.error) {
          toast.error(c.error.code === "23505" ? `A customer named "${f.newName.trim()}" already exists; pick it from the list` : c.error.message);
          return;
        }
        clientId = c.data.id;
      }
      const row = { client_id: clientId, title: f.title.trim(), source: f.source, submission_due: f.due || null, status: "identified" as const };
      let res = await supabase.from("tenders").insert({ ...row, ref_no: enquiryRef() }).select("ref_no").single();
      if (res.error?.code === "23505") res = await supabase.from("tenders").insert({ ...row, ref_no: enquiryRef() }).select("ref_no").single();
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
      toast.success(`Enquiry ${res.data.ref_no} created`);
      setF(EMPTY);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New enquiry
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New enquiry</DialogTitle>
            <DialogDescription>Starts at Identified. The client&apos;s tender number can follow later.</DialogDescription>
          </DialogHeader>
          <form
            id="new-enquiry"
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="enq-client">Customer</Label>
              <select id="enq-client" className={selectClass} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
                <option value="">Choose customer</option>
                <option value={NEW}>+ Add a new customer</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {isNew && (
              <div className="grid gap-3 rounded-lg border border-dashed p-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="enq-new-name">New customer name</Label>
                  <Input id="enq-new-name" value={f.newName} onChange={(e) => setF({ ...f, newName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="enq-new-type">Type</Label>
                  <select id="enq-new-type" className={selectClass} value={f.newType} onChange={(e) => setF({ ...f, newType: e.target.value as ClientType })}>
                    {(Object.keys(CLIENT_TYPE_LABEL) as ClientType[]).map((t) => (
                      <option key={t} value={t}>
                        {CLIENT_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="enq-title">What they need</Label>
              <Input id="enq-title" placeholder="e.g. 200 hydraulic seal kits" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="enq-source">Source</Label>
                <select id="enq-source" className={selectClass} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as TenderSource })}>
                  {ENQUIRY_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {SOURCE_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="enq-due">Due date</Label>
                <Input id="enq-due" type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
              </div>
            </div>
            {err && (
              <p role="alert" className="text-sm text-destructive">
                {err}
              </p>
            )}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" form="new-enquiry" disabled={pending}>
              {pending ? "Saving…" : "Create enquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
