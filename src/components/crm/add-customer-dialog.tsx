"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { CLIENT_TYPE_LABEL, type ClientType } from "@/components/masters/bits";

const schema = z.object({
  name: z.string().trim().min(2, "Enter the customer name"),
  type: z.enum(["defence_wing", "dpsu", "private_mfr"]),
  contact_person: z.string().trim(),
  phone: z.string().trim(),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
});

const selectClass = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";
const EMPTY = { name: "", type: "private_mfr" as ClientType, contact_person: "", phone: "", email: "" };

export function AddCustomerButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const parsed = schema.safeParse({ ...f, email: f.email.trim() });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setErr(null);
    const v = parsed.data;
    startTransition(async () => {
      const { error } = await createClient()
        .from("clients")
        .insert({
          name: v.name,
          type: v.type,
          contact_person: v.contact_person || null,
          phone: v.phone || null,
          email: v.email || null,
        });
      if (error) {
        toast.error(error.code === "23505" ? `A customer named "${v.name}" already exists` : error.message);
        return;
      }
      toast.success(`Customer ${v.name} added`);
      setF(EMPTY);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <UserPlus /> Add customer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add customer</DialogTitle>
            <DialogDescription>A new lead from a call, WhatsApp or referral.</DialogDescription>
          </DialogHeader>
          <form
            id="add-customer"
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="cust-name">Name</Label>
              <Input id="cust-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cust-type">Type</Label>
              <select id="cust-type" className={selectClass} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as ClientType })}>
                {(Object.keys(CLIENT_TYPE_LABEL) as ClientType[]).map((t) => (
                  <option key={t} value={t}>
                    {CLIENT_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cust-contact">Contact person</Label>
              <Input id="cust-contact" value={f.contact_person} onChange={(e) => setF({ ...f, contact_person: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="cust-phone">Phone</Label>
                <Input id="cust-phone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cust-email">Email</Label>
                <Input id="cust-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
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
            <Button type="submit" form="add-customer" disabled={pending}>
              {pending ? "Saving…" : "Save customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
