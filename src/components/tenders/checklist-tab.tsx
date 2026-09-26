"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

export type ChecklistRow = { id: string; kind: "item" | "required_doc" | "submission_check"; text: string; done: boolean; source: "ai" | "manual" };

const GROUPS: { kind: ChecklistRow["kind"]; title: string }[] = [
  { kind: "item", title: "Items to quote" },
  { kind: "required_doc", title: "Required documents" },
  { kind: "submission_check", title: "Submission checks" },
];

export function ChecklistTab({ items }: { items: ChecklistRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No checklist items yet.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {GROUPS.map(({ kind, title }) => {
        const rows = items.filter((i) => i.kind === kind);
        if (rows.length === 0) return null;
        return (
          <section key={kind} className="space-y-2">
            <h3 className="text-sm font-medium">
              {title}{" "}
              <span className="text-muted-foreground">
                {rows.filter((r) => r.done).length}/{rows.length}
              </span>
            </h3>
            <ul className="divide-y rounded-xl border bg-card">
              {rows.map((r) => (
                <CheckRow key={r.id} row={r} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function CheckRow({ row }: { row: ChecklistRow }) {
  const router = useRouter();
  const [done, setDone] = useState(row.done);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setDone(next);
    startTransition(async () => {
      const { error } = await createClient()
        .from("tender_checklist_items")
        .update({ done: next, done_at: next ? new Date().toISOString() : null })
        .eq("id", row.id);
      if (error) {
        setDone(!next);
        toast.error(error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li>
      <label className="flex cursor-pointer items-start gap-3 p-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 accent-primary"
          checked={done}
          disabled={pending}
          onChange={(e) => toggle(e.target.checked)}
        />
        <span className={`min-w-0 flex-1 break-words ${done ? "text-muted-foreground line-through" : ""}`}>{row.text}</span>
        {row.source === "ai" && <Badge variant="outline">AI</Badge>}
      </label>
    </li>
  );
}
