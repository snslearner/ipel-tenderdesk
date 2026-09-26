"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/list-bits";
import { createClient } from "@/lib/supabase/client";
import { formatDate, todayIST } from "@/lib/format";
import { useDbAction } from "@/components/use-db-action";
import type { ExtensionRow, PoSummary } from "./types";

const STATUS_VARIANT = { draft: "outline", sent: "secondary", approved: "default", rejected: "destructive" } as const;

export function ExtensionTab({ po, extensions }: { po: PoSummary; extensions: ExtensionRow[] }) {
  if (extensions.length === 0) {
    return (
      <EmptyState>
        No extension request. A draft letter is created automatically 45 days (sample value) before the due date
        while quantity is pending.
      </EmptyState>
    );
  }
  return (
    <ul className="space-y-4" data-testid="extensions">
      {extensions.map((x) => (
        <ExtensionItem key={x.id} po={po} x={x} />
      ))}
    </ul>
  );
}

function ExtensionItem({ po, x }: { po: PoSummary; x: ExtensionRow }) {
  const { pending, run } = useDbAction();
  const [approving, setApproving] = useState(false);
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(x.requested_date ?? "");
  const supabase = createClient();

  function approve() {
    run(
      "Extension approved; due date updated",
      async () => {
        const ext = await supabase
          .from("extension_requests")
          .update({ status: "approved", approval_ref: ref.trim(), approved_on: todayIST() })
          .eq("id", x.id);
        if (ext.error) return ext;
        return supabase.from("client_pos").update({ extended_due_date: date }).eq("id", po.id);
      },
      () => setApproving(false),
    );
  }

  return (
    <li className="space-y-3 rounded-xl border bg-card p-3 text-sm" data-testid="extension">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">Requested until {formatDate(x.requested_date)}</span>
        <Badge variant={STATUS_VARIANT[x.status]} className="capitalize" data-testid="extension-status">
          {x.status}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Created {formatDate(x.created_on)}
        {x.approval_ref && ` · approval ${x.approval_ref} on ${formatDate(x.approved_on)}`}
      </p>
      {x.reason && <p className="text-xs">Reason: {x.reason}</p>}

      {x.letter_text ? (
        <pre
          data-testid="letter-text"
          className="max-h-80 overflow-auto rounded-lg border bg-background p-3 font-sans text-xs leading-relaxed whitespace-pre-wrap"
        >
          {x.letter_text}
        </pre>
      ) : (
        <p className="text-xs text-muted-foreground">No letter text on this request.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {x.letter_text && (
          <Link href={`/orders/${po.id}/extension/${x.id}`} className={buttonVariants({ variant: "outline" })}>
            <Printer /> Print view
          </Link>
        )}
        {x.status === "draft" && (
          <Button
            disabled={pending}
            onClick={() => run("Marked sent", () => supabase.from("extension_requests").update({ status: "sent" }).eq("id", x.id))}
          >
            Mark sent
          </Button>
        )}
        {x.status === "sent" && (
          <>
            <Button disabled={pending} onClick={() => setApproving(true)}>
              Mark approved
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => run("Marked rejected", () => supabase.from("extension_requests").update({ status: "rejected" }).eq("id", x.id))}
            >
              Rejected
            </Button>
          </>
        )}
      </div>

      <Dialog open={approving} onOpenChange={setApproving}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extension approved by client</DialogTitle>
            <DialogDescription>This sets the PO&apos;s extended due date, which LD is then measured from.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="approval-ref">Approval reference</Label>
              <Input id="approval-ref" value={ref} onChange={(e) => setRef(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="approval-date">New due date</Label>
              <Input id="approval-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={() => (ref.trim() && date ? approve() : toast.error("Enter the approval reference and new date"))}
              disabled={pending}
            >
              Save approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
