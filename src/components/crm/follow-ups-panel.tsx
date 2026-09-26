"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import { roleLabel, type Role } from "@/lib/auth/roles";
import { useDbAction } from "@/components/use-db-action";

export type Channel = "call" | "email" | "visit";

export type FollowUp =
  | { kind: "reminder"; id: string; text: string; due: string; channel: Channel; role: Role | null }
  | { kind: "tender"; id: string; ref: string; title: string; client: string; due: string; channel: Channel; source: string };

const ICON = { call: Phone, email: Mail, visit: MapPin } as const;
const LABEL = { call: "Call", email: "Email", visit: "Visit" } as const;
const SHOW = 6;

export function FollowUpsPanel({ items, today, role }: { items: FollowUp[]; today: string; role: Role | null }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, SHOW);

  return (
    <section aria-labelledby="follow-ups" data-testid="follow-ups" className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="follow-ups" className="text-base font-semibold">
          Follow-ups today <span className="font-normal text-muted-foreground">{items.length}</span>
        </h2>
        <span className="text-xs text-muted-foreground">
          {role === "owner" || !role ? "Everyone's reminders" : `${roleLabel(role)} and unassigned`} · bids due within 7 days
        </span>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nothing to follow up today.</p>
      ) : (
        <ul className="divide-y">
          {shown.map((f) => (
            <FollowUpItem key={`${f.kind}-${f.id}`} f={f} today={today} role={role} />
          ))}
        </ul>
      )}
      {items.length > SHOW && (
        <Button variant="ghost" size="sm" onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show all ${items.length}`}
        </Button>
      )}
    </section>
  );
}

function FollowUpItem({ f, today, role }: { f: FollowUp; today: string; role: Role | null }) {
  const { pending, run } = useDbAction();
  const Icon = ICON[f.channel];
  const overdue = f.due < today;
  const supabase = createClient();

  function markDone() {
    const now = new Date().toISOString();
    if (f.kind === "reminder") {
      run("Marked done", () => supabase.from("reminders").update({ status: "done", done_at: now }).eq("id", f.id));
    } else {
      // A tender has no reminder row: record today's follow-up as done so it drops off until tomorrow.
      run("Follow-up recorded", () =>
        supabase.from("reminders").insert({
          kind: "tender_followup",
          entity_type: "tender",
          entity_id: f.id,
          due_on: today,
          assignee_role: role,
          channel: f.channel,
          text: `Followed up ${f.ref} (${f.client})`,
          status: "done",
          done_at: now,
        }),
      );
    }
  }

  return (
    <li data-testid="follow-up" data-kind={f.kind} className="flex items-start gap-3 py-2.5">
      <span
        className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted"
        title={LABEL[f.channel]}
        aria-label={LABEL[f.channel]}
        data-testid="follow-up-channel"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        {f.kind === "reminder" ? (
          <p className="text-sm break-words">{f.text}</p>
        ) : (
          <p className="text-sm break-words">
            Bid due: <Link href={`/tenders/${f.id}`} className="font-medium underline underline-offset-4">{f.ref}</Link> · {f.client} ·{" "}
            <span className="text-muted-foreground">{f.title}</span>
          </p>
        )}
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {overdue ? (
            <Badge variant="destructive">Overdue · {formatDate(f.due)}</Badge>
          ) : f.due === today ? (
            <Badge variant="outline">Today</Badge>
          ) : (
            <Badge variant="outline">Due {formatDate(f.due)}</Badge>
          )}
          {f.kind === "reminder" && f.role && <Badge variant="secondary">{roleLabel(f.role)}</Badge>}
          {f.kind === "tender" && <Badge variant="secondary">{f.source}</Badge>}
        </p>
      </div>
      <Button size="sm" variant="outline" className="shrink-0" disabled={pending} onClick={markDone}>
        Mark done
      </Button>
    </li>
  );
}
