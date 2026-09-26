import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRole, type Role } from "@/lib/auth/roles";
import { withJwtSkewRetry } from "@/lib/auth/jwt-skew-retry";

export type SessionUser = { id: string; email: string; fullName: string; role: Role | null };

// Signed-in user, or null when there is no session.
// Role comes from the database (fn_my_role), never from client state.
export const getOptionalSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, roleRes] = await Promise.all([
    withJwtSkewRetry(() =>
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    ),
    withJwtSkewRetry(() => supabase.rpc("fn_my_role")),
  ]);
  if (profileRes.error) throw new Error(`Could not load profile: ${profileRes.error.message}`);
  if (roleRes.error) throw new Error(`Could not load role: ${roleRes.error.message}`);

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profileRes.data?.full_name ?? user.email ?? "Unknown user",
    role: isRole(roleRes.data) ? roleRes.data : null,
  };
});

// For app pages: sends signed-out visitors to the sign-in page at "/".
export async function getSessionUser(): Promise<SessionUser> {
  const user = await getOptionalSessionUser();
  if (!user) redirect("/");
  return user;
}
