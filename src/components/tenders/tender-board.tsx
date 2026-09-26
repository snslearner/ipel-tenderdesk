"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatINRCompact } from "@/lib/format";
import { BOARD_STATUSES, SOURCE_LABEL, STATUS_LABEL, nextStage, type TenderStatus } from "@/lib/tenders";
import type { TenderRow } from "./tender-register";

const PER_COLUMN = 12;

// Kanban view of the bid pipeline. Moves are plain status updates: the database gates
// (lines complete, owner approval, checks ticked, loss reason) decide, and their message is shown.
export function TenderBoard({ rows }: { rows: TenderRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [losing, setLosing] = useState<TenderRow | null>(null);
  const [reason, setReason] = useState("");

  function move(t: TenderRow, to: TenderStatus, lossReason?: string) {
    setMovingId(t.id);
    startTransition(async () => {
      const { error } = await createClient()
        .from("tenders")
        .update(to === "lost" ? { status: to, loss_reason: lossReason } : { status: to })
        .eq("id", t.id);
      setMovingId(null);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`${t.ref_no} moved to ${STATUS_LABEL[to]}`);
      setLosing(null);
      setReason("");
      router.refresh();
    });
  }

  return (
    <>
      {/* Columns scroll sideways inside the board; the page itself never scrolls horizontally. */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0" data-testid="tender-board">
        <div className="flex gap-3">
          {BOARD_STATUSES.map((s) => {
            const col = rows.filter((r) => r.status === s);
            return (
              <section
                key={s}
                aria-label={STATUS_LABEL[s]}
                data-testid="board-column"
                className="flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-muted/50 p-2"
              >
                <h2 className="flex items-center justify-between px-1 text-sm font-medium">
                  {STATUS_LABEL[s]} <span className="text-xs text-muted-foreground">{col.length}</span>
                </h2>
                {col.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted-foreground">Nothing here</p>}
                {col.slice(0, PER_COLUMN).map((t) => {
                  const next = nextStage(t.status);
                  return (
                    <article key={t.id} data-testid="board-card" className="space-y-2 rounded-lg border bg-card p-2.5 text-sm shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/tenders/${t.id}`} className="font-medium whitespace-nowrap underline-offset-4 hover:underline">
                          {t.ref_no}
                        </Link>
                        <Badge variant="outline" className="shrink-0" data-testid="source-badge">
                          {SOURCE_LABEL[t.source]}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-xs">{t.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDate(t.submission_due)} · {t.total_bid ? formatINRCompact(t.total_bid) : "not priced"}
                      </p>
                      {next && (
                        <Button size="sm" variant="outline" className="w-full" disabled={pending} onClick={() => move(t, next)}>
                          {movingId === t.id ? "Moving…" : "Move to next stage"} <ArrowRight />
                        </Button>
                      )}
                      {t.status === "submitted" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" disabled={pending} onClick={() => move(t, "won")}>
                            Won
                          </Button>
                          <Button size="sm" variant="outline" disabled={pending} onClick={() => setLosing(t)}>
                            Lost
                          </Button>
                        </div>
                      )}
                    </article>
                  );
                })}
                {col.length > PER_COLUMN && (
                  <Link href={`/tenders?status=${s}`} className="px-1 text-xs underline underline-offset-4">
                    +{col.length - PER_COLUMN} more in the list
                  </Link>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <Dialog open={losing !== null} onOpenChange={(o) => !o && setLosing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {losing?.ref_no} lost</DialogTitle>
            <DialogDescription>A loss reason is required.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="board-loss">Loss reason</Label>
            <Textarea id="board-loss" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLosing(null)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={() => losing && move(losing, "lost", reason.trim())} disabled={pending || !reason.trim()}>
              Mark lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
