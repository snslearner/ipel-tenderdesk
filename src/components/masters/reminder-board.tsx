"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip, EmptyState } from "@/components/list-bits";
import { createClient } from "@/lib/supabase/client";
import { formatDate, todayIST } from "@/lib/format";
import { ROLES, roleLabel, type Role } from "@/lib/auth/roles";
import { useDbAction } from "@/components/use-db-action";
import type { Database } from "@/lib/database.types";

type Channel = Database["public"]["Enums"]["reminder_channel"];
type Row = { id: string; kind: string; text: string; due_on: string; assignee_role: Role | null; channel: Channel };

const KIND_LABEL: Record<string, string> = {
  bg_expiring: "Guarantee expiring",
  cert_expiring: "Certificate expiring",
  company_doc_expiring: "Company document expiring",
  extension_due: "Extension due",
  inspection_pending: "Inspection pending",
  payment_overdue: "Payment overdue",
  vendor_eta_late: "Vendor late",
  manual: "Manual",
};
const kindLabel = (k: string) => KIND_LABEL[k] ?? k.replace(/_/g, " ");
const selectClass = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

type Props = { rows: Row[]; role: Role | null; initialKind: string; initialMine: boolean };

export function ReminderBoard({ rows, role, initialKind, initialMine }: Props) {
  const [mine, setMine] = useState(initialMine && !!role);
  const [kind, setKind] = useState(initialKind);
  const today = todayIST();

  function sync(nextMine: boolean, nextKind: string) {
    const p = new URLSearchParams();
    if (nextMine) p.set("mine", "1");
    if (nextKind) p.set("kind", nextKind);
    window.history.replaceState(null, "", `/reminders${p.size ? `?${p}` : ""}`);
  }

  const visible = rows.filter((r) => (!mine || r.assignee_role === role) && (!kind || r.kind === kind));
  const groups: (Role | null)[] = [...ROLES, null];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter reminders">
        <Chip active={!mine} onClick={() => (setMine(false), sync(false, kind))}>
          All <span className="text-muted-foreground">{rows.length}</span>
        </Chip>
        {role && (
          <Chip active={mine} onClick={() => (setMine(true), sync(true, kind))}>
            Mine ({roleLabel(role)}) <span className="text-muted-foreground">{rows.filter((r) => r.assignee_role === role).length}</span>
          </Chip>
        )}
        {kind && (
          <button
            type="button"
            onClick={() => (setKind(""), sync(mine, ""))}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
            aria-label={`Remove filter ${kindLabel(kind)}`}
          >
            {kindLabel(kind)} <X className="size-3" />
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground" data-testid="reminder-count">
        Showing {visible.length} of {rows.length} open
      </p>

      {visible.length === 0 ? (
        <EmptyState>{rows.length === 0 ? "No open reminders." : "No open reminders match this filter."}</EmptyState>
      ) : (
        groups.map((g) => {
          const items = visible.filter((r) => r.assignee_role === g);
          if (items.length === 0) return null;
          return (
            <section key={g ?? "none"} className="space-y-2" data-testid="reminder-group">
              <h2 className="text-sm font-semibold">
                {g ? roleLabel(g) : "Unassigned"} <span className="font-normal text-muted-foreground">{items.length}</span>
              </h2>
              <ul className="divide-y rounded-xl border bg-card">
                {items.map((r) => (
                  <ReminderItem key={r.id} r={r} overdue={r.due_on < today} />
                ))}
              </ul>
            </section>
          );
        })
      )}

      <NewReminder defaultRole={role} />
    </div>
  );
}

function ReminderItem({ r, overdue }: { r: Row; overdue: boolean }) {
  const { pending, run } = useDbAction();
  return (
    <li data-testid="reminder" className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm break-words">{r.text}</p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {overdue ? <Badge variant="destructive">Overdue · {formatDate(r.due_on)}</Badge> : <Badge variant="outline">Due {formatDate(r.due_on)}</Badge>}
          <span>{kindLabel(r.kind)}</span>
          <span className="capitalize">· {r.channel}</span>
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          run("Marked done", () =>
            createClient().from("reminders").update({ status: "done", done_at: new Date().toISOString() }).eq("id", r.id),
          )
        }
      >
        Mark done
      </Button>
    </li>
  );
}

function NewReminder({ defaultRole }: { defaultRole: Role | null }) {
  const { pending, run } = useDbAction();
  const empty = { due_on: todayIST(), assignee_role: defaultRole ?? "owner", channel: "call" as Channel, text: "" };
  const [f, setF] = useState(empty);

  return (
    <form
      className="space-y-3 rounded-xl border p-3"
      data-testid="new-reminder"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          "Reminder added",
          () =>
            createClient().from("reminders").insert({
              kind: "manual",
              text: f.text.trim(),
              due_on: f.due_on,
              assignee_role: f.assignee_role as Role,
              channel: f.channel,
            }),
          () => setF(empty),
        );
      }}
    >
      <p className="text-sm font-medium">Add a reminder</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="rem-due">Due on</Label>
          <Input id="rem-due" type="date" value={f.due_on} onChange={(e) => setF({ ...f, due_on: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rem-role">Assign to</Label>
          <select id="rem-role" className={selectClass} value={f.assignee_role} onChange={(e) => setF({ ...f, assignee_role: e.target.value as Role })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="rem-channel">Channel</Label>
          <select id="rem-channel" className={selectClass} value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value as Channel })}>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="visit">Visit</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="rem-text">What to do</Label>
        <Input id="rem-text" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
      </div>
      <Button type="submit" disabled={!f.text.trim() || !f.due_on || pending}>
        Add reminder
      </Button>
    </form>
  );
}
