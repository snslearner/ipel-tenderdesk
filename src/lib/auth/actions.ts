"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/lib/auth/login-schema";

export async function signIn(input: LoginInput): Promise<{ error: string }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  // End any current session first so switching demo users never mixes identities.
  await supabase.auth.signOut({ scope: "local" });
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  // Local scope: end only this browser session, not every session of this user
  // (demo accounts are shared, so a global sign-out would log everyone out).
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
