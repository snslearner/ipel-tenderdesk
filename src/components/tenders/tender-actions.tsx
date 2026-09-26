"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { tenderActions, type TenderAction, type TenderStatus } from "@/lib/tenders";
import type { Role } from "@/lib/auth/roles";

type Props = { tenderId: string; status: TenderStatus; approved: boolean; role: Role | null };

const LABEL: Record<TenderAction, string> = {
  send_review: "Send for owner review",
  approve: "Approve",
  return: "Return to team",
  submit: "Submit",
  won: "Mark won",
  lost: "Mark lost",
};

// Buttons follow the status flow. Every rule (owner-only, lines complete, checks ticked,
// loss reason) is enforced by the database; its message is shown as a toast.
export function TenderActions({ tenderId, status, approved, role }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"return" | "lost" | null>(null);
  const [text, setText] = useState("");
  const actions = tenderActions(status, approved, role);

  function run(action: TenderAction, note?: string) {
    const supabase = createClient();
    startTransition(async () => {
      const { error } = await (() => {
        switch (action) {
          case "approve":
            return supabase.rpc("approve_tender", { p_tender_id: tenderId });
          case "return":
            return supabase.rpc("return_tender", { p_tender_id: tenderId, p_comment: note ?? "" });
          case "send_review":
            return supabase.from("tenders").update({ status: "owner_review" }).eq("id", tenderId);
          case "submit":
            return supabase.from("tenders").update({ status: "submitted" }).eq("id", tenderId);
          case "won":
            return supabase.from("tenders").update({ status: "won" }).eq("id", tenderId);
          case "lost":
            return supabase.from("tenders").update({ status: "lost", loss_reason: note ?? null }).eq("id", tenderId);
        }
      })();
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`${LABEL[action]}: done`);
      setDialog(null);
      setText("");
      router.refresh();
    });
  }

  if (actions.length === 0) {
    return status === "owner_review" && !approved ? (
      <p className="text-sm text-muted-foreground" data-testid="awaiting-owner">
        Waiting for owner approval.
      </p>
    ) : null;
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="tender-actions">
      {actions.map((a) => (
        <Button
          key={a}
          variant={a === "return" || a === "lost" ? "outline" : "default"}
          disabled={pending}
          onClick={() => (a === "return" || a === "lost" ? setDialog(a) : run(a))}
        >
          {LABEL[a]}
        </Button>
      ))}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "lost" ? "Mark tender lost" : "Return bid to team"}</DialogTitle>
            <DialogDescription>
              {dialog === "lost"
                ? "A loss reason is required."
                : "Tell the team what to change before sending it back."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="action-note">{dialog === "lost" ? "Loss reason" : "Comment"}</Label>
            <Textarea id="action-note" value={text} onChange={(e) => setText(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={() => dialog && run(dialog, text.trim())}
              disabled={pending || (dialog === "lost" && !text.trim())}
            >
              {dialog === "lost" ? "Mark lost" : "Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
