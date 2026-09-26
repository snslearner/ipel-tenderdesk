import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { ReminderBoard } from "@/components/masters/reminder-board";

export const metadata: Metadata = { title: "Reminders · IPEL TenderDesk" };

export default async function RemindersPage({ searchParams }: PageProps<"/reminders">) {
  const { kind, mine } = await searchParams;
  const supabase = await createClient();
  const [user, res] = await Promise.all([
    getSessionUser(),
    supabase
      .from("reminders")
      .select("id, kind, text, due_on, assignee_role, channel")
      .eq("status", "open")
      .order("due_on")
      .order("id"),
  ]);
  if (res.error) throw new Error(`Could not load reminders: ${res.error.message}`);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Reminders</h1>
      <ReminderBoard
        rows={res.data}
        role={user.role}
        initialKind={typeof kind === "string" ? kind : ""}
        initialMine={mine === "1"}
      />
    </div>
  );
}
